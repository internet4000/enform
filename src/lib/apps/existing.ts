/**
 * Whether a repo already has a record with given values in a collection, before
 * offering to copy one there. Reads up to a bounded number of pages, cached.
 */
import app from '#lib/config/app.json' with {type: 'json'}
import type {Identity} from '#lib/atproto/identity'
import {listRecords, type RepoRecord} from '#lib/atproto/repo'
import {identifying, sameValues} from './related'

const scanned = new Map<string, Promise<RepoRecord[]>>()

async function scan(repo: Identity, collection: string): Promise<RepoRecord[]> {
	const records: RepoRecord[] = []
	let cursor: string | undefined
	for (let page = 0; page < app.reads.scanPages; page++) {
		const result = await listRecords(repo, collection, cursor, app.reads.scanPageSize)
		records.push(...result.records)
		cursor = result.records.length === app.reads.scanPageSize ? result.cursor : undefined
		if (!cursor) break
	}
	return records
}

export async function findSame(
	repo: Identity,
	collection: string,
	fields: Record<string, unknown>
): Promise<RepoRecord | undefined> {
	const cached = `${repo.did} ${collection}`
	let records = scanned.get(cached)
	if (!records) {
		records = scan(repo, collection).catch(() => [])
		scanned.set(cached, records)
	}
	const key = identifying(fields)
	return (await records).find((record) => sameValues(record.value, key))
}
