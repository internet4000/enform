/**
 * Writes to your own repo: the current account's, each through a session that allows
 * it (the PDS validates records against lexicons it knows; we never ask it not to),
 * or the current local profile's, in this browser.
 */
import type {OAuthSession} from '@atproto/oauth-client-browser'
import {AtUri} from '@atproto/syntax'
import {auth} from '#lib/auth/session.svelte'
import {localIdentity} from './identity'
import * as m from '#lib/paraglide/messages.js'
import * as local from '#lib/local/store'
import {isExample} from '#lib/lexicons/examples/index'
import {TID} from '@atproto/common-web'
import {
	enqueue,
	markConflict,
	pendingFor,
	removePending,
	type PendingWrite
} from '#lib/outbox/store'
import {outbox} from '#lib/outbox/outbox.svelte'
import {isNetworkFailure, XrpcError} from './xrpc'

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

/**
 * Sends a write, or, if its PDS can't be reached, keeps it to send later and answers
 * as if written: you see it at once, marked as not sent yet (docs/local-first.md)
 */
async function sendOrKeep(
	write: Omit<PendingWrite, 'did' | 'createdAt'>,
	session: OAuthSession,
	send: () => Promise<WriteResult>
): Promise<WriteResult> {
	try {
		return await send()
	} catch (err) {
		if (!isNetworkFailure(err)) throw err
		await enqueue({...write, did: session.did})
		await outbox.refresh()
		const {collection, rkey} = write
		return {uri: `at://${session.did}/${collection}/${rkey}`, cid: '', collection, rkey}
	}
}

const fromLocal = (record: local.LocalRecord): WriteResult => ({
	uri: auth.local
		? `at://${localIdentity(auth.local).handle}/${record.collection}/${record.rkey}`
		: '',
	cid: record.version,
	collection: record.collection,
	rkey: record.rkey
})

/** An example app's records stay on this device: no one can resolve their type */
function onDeviceOnly(collection: string) {
	if (isExample(collection)) throw new Error(m.example_on_device())
}

export async function createRecord(
	collection: string,
	record: Record<string, unknown>,
	rkey?: string
) {
	if (auth.local)
		return fromLocal(await local.createRecord(auth.local.id, collection, record, rkey))
	onDeviceOnly(collection)
	const session = await auth.authorizeRepo(collection, 'create')
	// Its key is chosen here (a TID, unless the lexicon fixes it), so it can wait offline
	const key = rkey ?? TID.nextStr()
	return sendOrKeep({op: 'create', collection, rkey: key, value: record}, session, async () =>
		result(
			await call<WriteResult>(session, 'com.atproto.repo.createRecord', {
				repo: session.did,
				collection,
				rkey: key,
				record
			})
		)
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
	onDeviceOnly(collection)
	const session = await auth.authorizeRepo(collection, 'update')
	const write = {op: 'update' as const, collection, rkey, value: record, swap: swapRecord}
	// A record with writes still waiting gets this one after them
	if (await waitingOn(session.did, collection, rkey)) {
		return sendOrKeep(write, session, () => Promise.reject(new TypeError('waiting')))
	}
	return sendOrKeep(write, session, async () =>
		result(
			await call<WriteResult>(session, 'com.atproto.repo.putRecord', {
				repo: session.did,
				collection,
				rkey,
				record,
				swapRecord
			})
		)
	)
}

export async function deleteRecord(collection: string, rkey: string, swapRecord: string) {
	if (auth.local) return local.deleteRecord(auth.local.id, collection, rkey, swapRecord)
	const session = await auth.authorizeRepo(collection, 'delete')
	const write = {op: 'delete' as const, collection, rkey, swap: swapRecord}
	if (await waitingOn(session.did, collection, rkey)) {
		await sendOrKeep(write, session, () => Promise.reject(new TypeError('waiting')))
		return
	}
	await sendOrKeep(write, session, async () => {
		await call(session, 'com.atproto.repo.deleteRecord', {
			repo: session.did,
			collection,
			rkey,
			swapRecord
		})
		return {uri: '', cid: '', collection, rkey}
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

async function waitingOn(did: string, collection: string, rkey: string): Promise<boolean> {
	return (await pendingFor(did, collection).catch(() => [])).some((write) => write.rkey === rkey)
}

/**
 * Sends the current account's waiting writes, in order. A write that waited on another
 * swaps against the version that one made. A conflict (the record changed elsewhere)
 * or a refusal stops that write, kept to look at; an unreachable PDS stops them all.
 */
export async function sendWaiting(): Promise<number> {
	const session = auth.session
	if (!session || auth.local) return 0
	const writes = (await pendingFor(session.did)).filter((write) => !write.conflict)
	const versions = new Map<string, string>()
	let sent = 0
	for (const write of writes) {
		const key = `${write.collection}/${write.rkey}`
		const swap = write.swap || versions.get(key) || undefined
		const input = {repo: session.did, collection: write.collection, rkey: write.rkey}
		try {
			if (write.op === 'create') {
				const done = await call<WriteResult>(session, 'com.atproto.repo.createRecord', {
					...input,
					record: write.value
				})
				versions.set(key, done.cid)
			} else if (write.op === 'update') {
				const done = await call<WriteResult>(session, 'com.atproto.repo.putRecord', {
					...input,
					record: write.value,
					swapRecord: swap
				})
				versions.set(key, done.cid)
			} else {
				await call(session, 'com.atproto.repo.deleteRecord', {...input, swapRecord: swap})
				versions.delete(key)
			}
			await removePending(write.id as number)
			sent++
		} catch (err) {
			if (isNetworkFailure(err)) break
			await markConflict(write, (err as Error).message)
		}
	}
	await outbox.refresh()
	return sent
}

/**
 * Your account's new handle (com.atproto.identity.updateHandle): one of its server's
 * domains, or your own once it points at you. Not kept to send later: it's now or not.
 */
export async function updateHandle(handle: string) {
	const session = await auth.authorizeHandle()
	await call(session, 'com.atproto.identity.updateHandle', {handle})
	await auth.refreshIdentity()
}
