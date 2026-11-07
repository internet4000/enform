/**
 * Writes to the signed-in account's own repo, each through a session that allows it.
 * The PDS validates records against lexicons it knows; we never ask it not to.
 */
import type {OAuthSession} from '@atproto/oauth-client-browser'
import {auth} from '#lib/auth/session.svelte'
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

export type WriteResult = {uri: string; cid: string}

export async function createRecord(
	collection: string,
	record: Record<string, unknown>,
	rkey?: string
) {
	const session = await auth.authorizeRepo(collection, 'create')
	return call<WriteResult>(session, 'com.atproto.repo.createRecord', {
		repo: session.did,
		collection,
		rkey,
		record
	})
}

/** Replaces a record, failing if it changed since `swapRecord` (its CID when read) */
export async function putRecord(
	collection: string,
	rkey: string,
	record: Record<string, unknown>,
	swapRecord: string
) {
	const session = await auth.authorizeRepo(collection, 'update')
	return call<WriteResult>(session, 'com.atproto.repo.putRecord', {
		repo: session.did,
		collection,
		rkey,
		record,
		swapRecord
	})
}

export async function deleteRecord(collection: string, rkey: string, swapRecord: string) {
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
	const session = await auth.authorizeBlob(file.type)
	const {blob} = await procedure<{blob: unknown}>(
		session,
		'com.atproto.repo.uploadBlob',
		file,
		file.type || 'application/octet-stream'
	)
	return blob
}
