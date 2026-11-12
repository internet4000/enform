/**
 * Many records at once: gathered whole from a repo (every page, from its PDS or this
 * device), then deleted in batches, each one commit (com.atproto.repo.applyWrites).
 * A PDS limits how much one writes per hour: when it says to wait, the batch waits and
 * is sent again. Writes not sent yet to those collections are let go with them.
 */
import type {OAuthSession} from '@atproto/oauth-client-browser'
import {auth} from '#lib/auth/session.svelte'
import * as local from '#lib/local/store'
import {pendingFor, removePending} from '#lib/outbox/store'
import {outbox} from '#lib/outbox/outbox.svelte'
import type {Identity} from './identity'
import {fromLocal, type RepoRecord} from './repo'
import {xrpcGet, XrpcError} from './xrpc'
import {AtUri} from '@atproto/syntax'

/** Writes per commit: the reference PDS takes up to 200 */
export const BATCH = 100

/** Every record of these collections in a repo, as stored (no writes waiting overlaid) */
export async function gatherRecords(
	repo: Identity,
	collections: string[],
	progress: (count: number) => void = () => {}
): Promise<RepoRecord[]> {
	const all: RepoRecord[] = []
	if (repo.local) {
		const records = await local.allRecords(repo.local)
		all.push(
			...records
				.filter((record) => collections.includes(record.collection))
				.map((record) => fromLocal(record, repo.handle))
		)
		progress(all.length)
		return all
	}
	for (const collection of collections) {
		let cursor: string | undefined
		do {
			const page = await xrpcGet<{
				records: {uri: string; cid: string; value: Record<string, unknown>}[]
				cursor?: string
			}>(repo.pds, 'com.atproto.repo.listRecords', {repo: repo.did, collection, limit: 100, cursor})
			for (const record of page.records) {
				all.push({...record, collection, rkey: new AtUri(record.uri).rkey})
			}
			progress(all.length)
			// A page with nothing new ends it, whatever cursor a PDS sends back
			cursor = page.records.length ? page.cursor : undefined
		} while (cursor)
	}
	return all
}

const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))

/** How long a PDS asks to wait before writing again: its rate limit's reset, else a minute */
function waitFor(res: Response): number {
	const reset = Number(res.headers.get('ratelimit-reset'))
	return reset ? Math.max(1000, reset * 1000 - Date.now()) : 60_000
}

async function applyWrites(session: OAuthSession, writes: object[]) {
	for (;;) {
		const res = await session.fetchHandler('/xrpc/com.atproto.repo.applyWrites', {
			method: 'POST',
			headers: {'content-type': 'application/json'},
			body: JSON.stringify({repo: session.did, writes})
		})
		if (res.status === 429) {
			await wait(waitFor(res))
			continue
		}
		const json = await res.json().catch(() => undefined)
		if (!res.ok) {
			throw new XrpcError(res.status, json?.error, json?.message ?? `applyWrites (${res.status})`)
		}
		return
	}
}

/** A change to one record: its new value, or none to delete it */
export type Change = Pick<RepoRecord, 'collection' | 'rkey' | 'cid'> & {
	value?: Record<string, unknown>
}

/**
 * Writes these changes to the current account's repo (or this device's), a batch at a
 * time; `progress` counts those written. Stops between batches once `signal` aborts.
 */
export async function writeRecords(
	changes: Change[],
	progress: (written: number) => void,
	signal?: AbortSignal
): Promise<number> {
	let written = 0
	if (auth.local) {
		for (const {collection, rkey, cid, value} of changes) {
			if (signal?.aborted) break
			if (value) await local.putRecord(auth.local.id, collection, rkey, value, cid)
			else await local.deleteRecord(auth.local.id, collection, rkey, cid)
			progress(++written)
		}
		return written
	}
	const collections = [...new Set(changes.map((change) => change.collection))]
	const updates = changes.some((change) => change.value)
	const deletes = changes.some((change) => !change.value)
	let session = await auth.authorizeRepos(collections, updates ? 'update' : 'delete')
	if (updates && deletes) session = await auth.authorizeRepos(collections, 'delete')
	for (let at = 0; at < changes.length && !signal?.aborted; at += BATCH) {
		const batch = changes.slice(at, at + BATCH)
		await applyWrites(
			session,
			batch.map(({collection, rkey, value}) =>
				value
					? {$type: 'com.atproto.repo.applyWrites#update', collection, rkey, value}
					: {$type: 'com.atproto.repo.applyWrites#delete', collection, rkey}
			)
		)
		written += batch.length
		progress(written)
	}
	// Writes still waiting for records deleted now go with them
	const gone = new Set(
		changes.filter((change) => !change.value).map((c) => `${c.collection}/${c.rkey}`)
	)
	if (gone.size) {
		for (const collection of collections) {
			for (const write of await pendingFor(session.did, collection).catch(() => [])) {
				if (write.id !== undefined && gone.has(`${write.collection}/${write.rkey}`))
					await removePending(write.id)
			}
		}
		await outbox.refresh()
	}
	return written
}
