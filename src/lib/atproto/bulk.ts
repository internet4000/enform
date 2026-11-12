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

/**
 * Deletes these records from the current account's repo (or this device's), a batch at
 * a time; `progress` counts those deleted. Stops between batches once `signal` aborts.
 */
export async function deleteRecords(
	records: Pick<RepoRecord, 'collection' | 'rkey' | 'cid'>[],
	progress: (deleted: number) => void,
	signal?: AbortSignal
): Promise<number> {
	let deleted = 0
	if (auth.local) {
		for (const record of records) {
			if (signal?.aborted) break
			await local.deleteRecord(auth.local.id, record.collection, record.rkey, record.cid)
			progress(++deleted)
		}
		return deleted
	}
	const collections = [...new Set(records.map((record) => record.collection))]
	const session = await auth.authorizeRepos(collections, 'delete')
	for (let at = 0; at < records.length && !signal?.aborted; at += BATCH) {
		const batch = records.slice(at, at + BATCH)
		await applyWrites(
			session,
			batch.map(({collection, rkey}) => ({
				$type: 'com.atproto.repo.applyWrites#delete',
				collection,
				rkey
			}))
		)
		deleted += batch.length
		progress(deleted)
	}
	// What waited to be sent to those collections goes with them
	if (!signal?.aborted) {
		for (const collection of collections) {
			for (const write of await pendingFor(session.did, collection).catch(() => [])) {
				if (write.id !== undefined) await removePending(write.id)
			}
		}
		await outbox.refresh()
	}
	return deleted
}
