/**
 * Writes to your own repo: the current account's, each through a session that allows
 * it (the PDS validates records against lexicons it knows; we never ask it not to),
 * or the current local profile's, in this browser.
 */
import type {OAuthSession} from '@atproto/oauth-client-browser'
import {AtUri} from '@atproto/syntax'
import {auth} from '#lib/auth/session.svelte'
import * as local from '#lib/local/store'
import {XrpcError} from './xrpc'

async function procedure<T>(session: OAuthSession, nsid: string, body: BodyInit, type: string) {
	const res = await session.fetchHandler(`/xrpc/${nsid}`, {
		method: 'POST',
		headers: {'content-type': type},
		body
	})
	const json = await res.json().catch(() => undefined)
	if (!res.ok) {
		throw new XrpcError(res.status, json?.error, json?.message ?? `${nsid} failed (${res.status})`)
	}
	return json as T
}

const call = <T>(session: OAuthSession, nsid: string, input: object) =>
	procedure<T>(session, nsid, JSON.stringify(input), 'application/json')

export type WriteResult = {uri: string; cid: string; collection: string; rkey: string}

function result(written: {uri: string; cid: string}): WriteResult {
	const at = new AtUri(written.uri)
	return {...written, collection: at.collection, rkey: at.rkey}
}

const fromLocal = (record: local.LocalRecord): WriteResult => ({
	uri: '',
	cid: record.version,
	collection: record.collection,
	rkey: record.rkey
})

export async function createRecord(
	collection: string,
	record: Record<string, unknown>,
	rkey?: string
) {
	if (auth.local)
		return fromLocal(await local.createRecord(auth.local.id, collection, record, rkey))
	const session = await auth.authorizeRepo(collection, 'create')
	return result(
		await call<WriteResult>(session, 'com.atproto.repo.createRecord', {
			repo: session.did,
			collection,
			rkey,
			record
		})
	)
}

/** Replaces a record, failing if it changed since `swapRecord` (its CID when read) */
export async function putRecord(
	collection: string,
	rkey: string,
	record: Record<string, unknown>,
	swapRecord: string
) {
	if (auth.local) {
		return fromLocal(await local.putRecord(auth.local.id, collection, rkey, record, swapRecord))
	}
	const session = await auth.authorizeRepo(collection, 'update')
	return result(
		await call<WriteResult>(session, 'com.atproto.repo.putRecord', {
			repo: session.did,
			collection,
			rkey,
			record,
			swapRecord
		})
	)
}

export async function deleteRecord(collection: string, rkey: string, swapRecord: string) {
	if (auth.local) return local.deleteRecord(auth.local.id, collection, rkey, swapRecord)
	const session = await auth.authorizeRepo(collection, 'delete')
	await call(session, 'com.atproto.repo.deleteRecord', {
		repo: session.did,
		collection,
		rkey,
		swapRecord
	})
}

/** Uploads a file; the blob ref goes into a record, which must be written soon after */
export async function uploadBlob(file: File): Promise<unknown> {
	if (auth.local) throw new Error('Local profiles hold no files yet')
	const session = await auth.authorizeBlob(file.type)
	const {blob} = await procedure<{blob: unknown}>(
		session,
		'com.atproto.repo.uploadBlob',
		file,
		file.type || 'application/octet-stream'
	)
	return blob
}

export type BatchCreate = {collection: string; rkey: string; value: Record<string, unknown>}

/** Creates records in the current account in batches of the PDS's limit, keeping their keys */
export async function createBatch(records: BatchCreate[], size = 200) {
	const collections = [...new Set(records.map((record) => record.collection))]
	const session = await auth.authorizeRepos(collections, 'create')
	for (let start = 0; start < records.length; start += size) {
		await call(session, 'com.atproto.repo.applyWrites', {
			repo: session.did,
			writes: records.slice(start, start + size).map(({collection, rkey, value}) => ({
				$type: 'com.atproto.repo.applyWrites#create',
				collection,
				rkey,
				value
			}))
		})
	}
}
