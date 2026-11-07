/** Public reads of a repo, straight from its own PDS */
import app from '#lib/config/app.json' with {type: 'json'}
import type {Identity} from './identity'
import {xrpcGet} from './xrpc'

export type RepoRecord = {uri: string; cid: string; value: Record<string, unknown>}

export async function listCollections(repo: Identity): Promise<string[]> {
	const {collections} = await xrpcGet<{collections: string[]}>(
		repo.pds,
		'com.atproto.repo.describeRepo',
		{repo: repo.did}
	)
	return collections
}

export function listRecords(repo: Identity, collection: string, cursor?: string) {
	return xrpcGet<{records: RepoRecord[]; cursor?: string}>(
		repo.pds,
		'com.atproto.repo.listRecords',
		{
			repo: repo.did,
			collection,
			limit: app.reads.pageSize,
			cursor
		}
	)
}

export function getRecord(repo: Identity, collection: string, rkey: string) {
	return xrpcGet<RepoRecord>(repo.pds, 'com.atproto.repo.getRecord', {
		repo: repo.did,
		collection,
		rkey
	})
}

/** Where a blob of this repo can be fetched */
export function blobUrl(repo: Identity, cid: string): string {
	const url = new URL('/xrpc/com.atproto.sync.getBlob', repo.pds)
	url.searchParams.set('did', repo.did)
	url.searchParams.set('cid', cid)
	return url.href
}
