/**
 * What a record links to, read like content: the people (DIDs) and records (at:// URIs,
 * strong refs) it names. Each is read from its own repo's PDS, once per session.
 */
import {AtUri} from '@atproto/syntax'
import {resolveIdentity, type Identity} from '#lib/atproto/identity'
import {blobUrl, getRecord} from '#lib/atproto/repo'
import {resolveLexicon} from '#lib/lexicons/resolve'
import {recordCard, type BlobRef} from './card'
import {recordDate} from './summary'

export const PROFILE_COLLECTION = 'app.bsky.actor.profile'

export type Person = {
	identity: Identity
	/** Their profile's display name, when they have one */
	name?: string
	avatar?: string
}

export type LinkedRecord = {
	uri: string
	collection: string
	author: Identity
	title?: string
	text?: string
	image?: string
	date?: string
}

/** One promise per key: a failed one is forgotten, so it can be tried again later */
function cached<T>(cache: Map<string, Promise<T>>, key: string, load: () => Promise<T>) {
	let found = cache.get(key)
	if (!found) {
		found = load()
		found.catch(() => cache.delete(key))
		cache.set(key, found)
	}
	return found
}

const people = new Map<string, Promise<Person>>()

async function loadPerson(actor: string): Promise<Person> {
	const identity = await resolveIdentity(actor)
	const profile = await getRecord(identity, PROFILE_COLLECTION, 'self').catch(() => undefined)
	const name = profile?.value.displayName
	const avatar = profile ? recordCard(profile.value).avatar : undefined
	return {
		identity,
		name: typeof name === 'string' && name.trim() ? name.trim() : undefined,
		avatar: avatar ? blobUrl(identity, avatar) : undefined
	}
}

/** A handle or DID as a person: their verified identity, name and avatar */
export function resolvePerson(actor: string): Promise<Person> {
	return cached(people, actor, () => loadPerson(actor))
}

/** Identifiers aren't titles: a summary that is only a link reads as nothing */
function readable(text: string | undefined): string | undefined {
	return text && !/^(at:\/\/|did:)/.test(text) ? text : undefined
}

function isImage(value: unknown): value is BlobRef {
	const blob = value as BlobRef | undefined
	return blob?.$type === 'blob' && !!blob.mimeType?.startsWith('image/') && !!blob.ref?.$link
}

/** The first image in a value, looking a few levels down (embeds, their media, their images) */
export function firstImage(value: unknown, depth = 5): string | undefined {
	if (isImage(value)) return value.ref.$link
	if (depth === 0 || typeof value !== 'object' || value === null) return undefined
	for (const child of Object.values(value)) {
		const found = firstImage(child, depth - 1)
		if (found) return found
	}
	return undefined
}

const records = new Map<string, Promise<LinkedRecord>>()

async function loadRecord(uri: string): Promise<LinkedRecord> {
	const at = new AtUri(uri)
	if (!at.collection || !at.rkey) throw new Error(`Not a record URI: ${uri}`)
	const author = await resolveIdentity(at.host)
	const [{value}, lexicon] = await Promise.all([
		getRecord(author, at.collection, at.rkey),
		resolveLexicon(at.collection).catch(() => undefined)
	])
	const card = recordCard(value, lexicon?.defs.main?.record)
	const image = card.avatar ?? card.banner ?? firstImage(value)
	return {
		uri,
		collection: at.collection,
		author,
		title: readable(card.title),
		text: readable(card.text),
		image: image ? blobUrl(author, image) : undefined,
		date: recordDate(value)
	}
}

/** An at:// URI's record, summed up for a card */
export function resolveLinkedRecord(uri: string): Promise<LinkedRecord> {
	return cached(records, uri, () => loadRecord(uri))
}

/** Whether an at:// URI names one record (not a repo or a collection) */
export function isRecordUri(uri: string): boolean {
	try {
		const at = new AtUri(uri)
		return !!at.collection && !!at.rkey
	} catch {
		return false
	}
}
