/**
 * Reads of a repo: an account's, public, straight from its own PDS; or a local
 * profile's, from this browser (docs/local-first.md).
 */
import {AtUri} from '@atproto/syntax'
import app from '#lib/config/app.json' with {type: 'json'}
import * as local from '#lib/local/store'
import type {Identity} from './identity'
import {xrpcGet} from './xrpc'

export type RepoRecord = {
	/** Its at:// URI; empty for a local profile's record, which has none */
	uri: string
	/** Its CID, or a local record's version */
	cid: string
	collection: string
	rkey: string
	value: Record<string, unknown>
}

type Wire = {uri: string; cid: string; value: Record<string, unknown>}

function fromWire(record: Wire): RepoRecord {
	const at = new AtUri(record.uri)
	return {...record, collection: at.collection, rkey: at.rkey}
}

export function fromLocal(record: local.LocalRecord): RepoRecord {
	const {collection, rkey, value, version} = record
	return {uri: '', cid: version, collection, rkey, value}
}

export async function listCollections(repo: Identity): Promise<string[]> {
	if (repo.local) return local.listCollections(repo.local)
	const {collections} = await xrpcGet<{collections: string[]}>(
		repo.pds,
		'com.atproto.repo.describeRepo',
		{repo: repo.did}
	)
	return collections
}

export async function listRecords(
	repo: Identity,
	collection: string,
	cursor?: string,
	limit: number = app.reads.pageSize
): Promise<{records: RepoRecord[]; cursor?: string}> {
	if (repo.local) {
		const page = await local.listRecords(repo.local, collection, limit, cursor)
		return {records: page.records.map(fromLocal), cursor: page.cursor}
	}
	const page = await xrpcGet<{records: Wire[]; cursor?: string}>(
		repo.pds,
		'com.atproto.repo.listRecords',
		{repo: repo.did, collection, limit, cursor}
	)
	return {records: page.records.map(fromWire), cursor: page.cursor}
}

export async function getRecord(repo: Identity, collection: string, rkey: string) {
	if (repo.local) {
		const record = await local.getRecord(repo.local, collection, rkey)
		if (!record) throw new Error(`No ${collection} record ${rkey}`)
		return fromLocal(record)
	}
	return fromWire(
		await xrpcGet<Wire>(repo.pds, 'com.atproto.repo.getRecord', {
			repo: repo.did,
			collection,
			rkey
		})
	)
}

/** Where a blob of this repo can be fetched (local profiles hold none) */
export function blobUrl(repo: Identity, cid: string): string {
	if (repo.local) return ''
	const url = new URL('/xrpc/com.atproto.sync.getBlob', repo.pds)
	url.searchParams.set('did', repo.did)
	url.searchParams.set('cid', cid)
	return url.href
}
