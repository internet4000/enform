/**
 * Local profiles: repos that live in this browser only, named by their person, with
 * no DID; their handle is their name's, under .local (local/handle.ts). Their records are valid records of their lexicons, keyed the way
 * atproto keys them (TIDs, or the lexicon's literal key), so they can be published
 * to an account later as they are. See docs/local-first.md.
 */
import {TID} from '@atproto/common-web'
import {BY_COLLECTION, PROFILES, RECORDS, run} from './db'
import {slugify, uniqueSlug} from './handle'

export type LocalProfile = {
	id: string
	name: string
	createdAt: string
	/** Its handle's label (my-radio → @my-radio.local), unique on the device; kept when
	    renamed. Profiles made before had none: their name's is used */
	slug?: string
}

/** A local profile's handle label */
export const slugOf = (profile: LocalProfile) => profile.slug ?? slugify(profile.name)

/** The local profile a handle label names (the first made, if older ones share it) */
export async function profileBySlug(slug: string): Promise<LocalProfile | undefined> {
	const profiles = await listProfiles()
	return profiles
		.sort((a, b) => a.createdAt.localeCompare(b.createdAt))
		.find((profile) => slugOf(profile) === slug)
}

export type LocalRecord = {
	profile: string
	collection: string
	rkey: string
	value: Record<string, unknown>
	/** A hash of the value, standing for a CID: writes swap against it */
	version: string
}

export class LocalConflict extends Error {}

async function versionOf(value: unknown): Promise<string> {
	const bytes = new TextEncoder().encode(JSON.stringify(value))
	const digest = await crypto.subtle.digest('SHA-256', bytes)
	return [...new Uint8Array(digest).slice(0, 16)]
		.map((b) => b.toString(16).padStart(2, '0'))
		.join('')
}

export function listProfiles(): Promise<LocalProfile[]> {
	return run<LocalProfile[]>(PROFILES, 'readonly', (store) => store.getAll())
}

export function getProfile(id: string): Promise<LocalProfile | undefined> {
	return run<LocalProfile | undefined>(PROFILES, 'readonly', (store) => store.get(id))
}

export async function createProfile(name: string): Promise<LocalProfile> {
	const taken = (await listProfiles()).map(slugOf)
	const profile = {
		id: TID.nextStr(),
		name,
		createdAt: new Date().toISOString(),
		slug: uniqueSlug(name, taken)
	}
	await run(PROFILES, 'readwrite', (store) => store.put(profile))
	return profile
}

export async function renameProfile(id: string, name: string) {
	const profile = await getProfile(id)
	if (profile) await run(PROFILES, 'readwrite', (store) => store.put({...profile, name}))
}

/** Removes a profile and all its records */
export async function removeProfile(id: string) {
	const records = await allRecords(id)
	for (const record of records) {
		await run(RECORDS, 'readwrite', (store) => store.delete([id, record.collection, record.rkey]))
	}
	await run(PROFILES, 'readwrite', (store) => store.delete(id))
}

export function allRecords(profile: string): Promise<LocalRecord[]> {
	const range = IDBKeyRange.bound([profile], [profile, []])
	return run<LocalRecord[]>(RECORDS, 'readonly', (store) => store.getAll(range))
}

export async function listCollections(profile: string): Promise<string[]> {
	return [...new Set((await allRecords(profile)).map((record) => record.collection))].sort()
}

/** A collection's records, newest key first, a page after `cursor` (an rkey) */
export async function listRecords(
	profile: string,
	collection: string,
	limit: number,
	cursor?: string
): Promise<{records: LocalRecord[]; cursor?: string}> {
	const all = await run<LocalRecord[]>(RECORDS, 'readonly', (store) =>
		store.index(BY_COLLECTION).getAll([profile, collection])
	)
	const sorted = all.sort((a, b) => b.rkey.localeCompare(a.rkey))
	const start = cursor ? sorted.findIndex((record) => record.rkey < cursor) : 0
	const records = start === -1 ? [] : sorted.slice(start, start + limit)
	return {records, cursor: records.length === limit ? records.at(-1)?.rkey : undefined}
}

export function getRecord(profile: string, collection: string, rkey: string) {
	return run<LocalRecord | undefined>(RECORDS, 'readonly', (store) =>
		store.get([profile, collection, rkey])
	)
}

/** Creates a record; `rkey` when the lexicon fixes it, else a new TID */
export async function createRecord(
	profile: string,
	collection: string,
	value: Record<string, unknown>,
	rkey = TID.nextStr()
): Promise<LocalRecord> {
	if (await getRecord(profile, collection, rkey)) throw new LocalConflict(`${rkey} exists`)
	const record = {profile, collection, rkey, value, version: await versionOf(value)}
	await run(RECORDS, 'readwrite', (store) => store.put(record))
	return record
}

/** Replaces a record, failing if it changed since `swap` (its version when read) */
export async function putRecord(
	profile: string,
	collection: string,
	rkey: string,
	value: Record<string, unknown>,
	swap: string
): Promise<LocalRecord> {
	const current = await getRecord(profile, collection, rkey)
	if (current && current.version !== swap) throw new LocalConflict(`${rkey} changed`)
	const record = {profile, collection, rkey, value, version: await versionOf(value)}
	await run(RECORDS, 'readwrite', (store) => store.put(record))
	return record
}

export async function deleteRecord(
	profile: string,
	collection: string,
	rkey: string,
	swap: string
) {
	const current = await getRecord(profile, collection, rkey)
	if (current && current.version !== swap) throw new LocalConflict(`${rkey} changed`)
	await run(RECORDS, 'readwrite', (store) => store.delete([profile, collection, rkey]))
}
