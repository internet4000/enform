/**
 * Reads of a repo: an account's, public, straight from its own PDS; or a local
 * profile's, from this browser (docs/local-first.md).
 */
import {AtUri} from '@atproto/syntax'
import app from '#lib/config/app.json' with {type: 'json'}
import * as local from '#lib/local/store'
import type {Identity} from './identity'
import {overlayList, overlayRecord} from '#lib/outbox/overlay'
import {pendingFor} from '#lib/outbox/store'
import {isNetworkFailure, xrpcGet, XrpcError} from './xrpc'

export type RepoRecord = {
	/** Its at:// URI; empty for a local profile's record, which has none */
	uri: string
	/** Its CID, or a local record's version */
	cid: string
	collection: string
	rkey: string
	value: Record<string, unknown>
	/** A write to it not sent yet: waiting, or stopped by a conflict */
	pending?: 'waiting' | 'conflict'
}

type Wire = {uri: string; cid: string; value: Record<string, unknown>}

function fromWire(record: Wire): RepoRecord {
	const at = new AtUri(record.uri)
	return {...record, collection: at.collection, rkey: at.rkey}
}

/** A local profile's record: its at:// URI names its repo by handle (`name.local`), as it
    has no DID: valid, and resolved on this device only */
export function fromLocal(record: local.LocalRecord, handle?: string): RepoRecord {
	const {collection, rkey, value, version} = record
	return {
		uri: handle ? `at://${handle}/${collection}/${rkey}` : '',
		cid: version,
		collection,
		rkey,
		value
	}
}

/** What was last read of each account, to show while its PDS can't be reached */
const lastSeen = new Map<string, unknown>()

async function orLastSeen<T>(key: string, read: () => Promise<T>): Promise<T> {
	try {
		const result = await read()
		lastSeen.set(key, result)
		return result
	} catch (err) {
		if (isNetworkFailure(err) && lastSeen.has(key)) return lastSeen.get(key) as T
		throw err
	}
}

const waiting = (did: string, collection?: string) => pendingFor(did, collection).catch(() => [])

export async function listCollections(repo: Identity): Promise<string[]> {
	if (repo.local) return local.listCollections(repo.local)
	const {collections} = await orLastSeen(`collections ${repo.did}`, () =>
		xrpcGet<{collections: string[]}>(repo.pds, 'com.atproto.repo.describeRepo', {repo: repo.did})
	)
	// Collections created by writes not sent yet are there too
	const pending = (await waiting(repo.did)).map((write) => write.collection)
	return [...new Set([...collections, ...pending])].sort()
}

export async function listRecords(
	repo: Identity,
	collection: string,
	cursor?: string,
	limit: number = app.reads.pageSize
): Promise<{records: RepoRecord[]; cursor?: string}> {
	if (repo.local) {
		const page = await local.listRecords(repo.local, collection, limit, cursor)
		return {
			records: page.records.map((record) => fromLocal(record, repo.handle)),
			cursor: page.cursor
		}
	}
	const writes = await waiting(repo.did, collection)
	const page = await orLastSeen(`records ${repo.did} ${collection} ${cursor} ${limit}`, () =>
		xrpcGet<{records: Wire[]; cursor?: string}>(repo.pds, 'com.atproto.repo.listRecords', {
			repo: repo.did,
			collection,
			limit,
			cursor
		})
	).catch((err) => {
		// A collection only made of writes not sent yet
		if (writes.length && (isNetworkFailure(err) || err instanceof XrpcError))
			return {records: [] as Wire[], cursor: undefined}
		throw err
	})
	const records = overlayList(page.records.map(fromWire), writes, !cursor)
	return {records, cursor: page.cursor}
}

export async function getRecord(repo: Identity, collection: string, rkey: string) {
	if (repo.local) {
		const record = await local.getRecord(repo.local, collection, rkey)
		if (!record) throw new Error(`No ${collection} record ${rkey}`)
		return fromLocal(record, repo.handle)
	}
	const writes = await waiting(repo.did, collection)
	const read = orLastSeen(`record ${repo.did} ${collection} ${rkey}`, () =>
		xrpcGet<Wire>(repo.pds, 'com.atproto.repo.getRecord', {repo: repo.did, collection, rkey})
	).then(fromWire)
	if (!writes.length) return read
	const record = await read.catch(() => undefined)
	const shown = overlayRecord(record, writes, collection, rkey)
	if (!shown) throw new Error(`No ${collection} record ${rkey}`)
	return shown
}

/** Where a blob of this repo can be fetched (local profiles hold none) */
export function blobUrl(repo: Identity, cid: string): string {
	if (repo.local) return ''
	const url = new URL('/xrpc/com.atproto.sync.getBlob', repo.pds)
	url.searchParams.set('did', repo.did)
	url.searchParams.set('cid', cid)
	return url.href
}
