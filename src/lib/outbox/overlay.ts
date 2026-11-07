/**
 * An account's repo as you'll see it once your writes are sent: its records, with the
 * writes still waiting laid over them (created ones added, updated ones replaced,
 * deleted ones gone)
 */
import type {RepoRecord} from '#lib/atproto/repo'
import type {PendingWrite} from './store'

const key = (collection: string, rkey: string) => `${collection}/${rkey}`

function asRecord(write: PendingWrite): RepoRecord {
	return {
		uri: `at://${write.did}/${write.collection}/${write.rkey}`,
		cid: '',
		collection: write.collection,
		rkey: write.rkey,
		value: write.value ?? {},
		pending: write.conflict ? 'conflict' : 'waiting'
	}
}

/** The last write waiting for each record */
function latest(writes: PendingWrite[]): Map<string, PendingWrite> {
	return new Map(writes.map((write) => [key(write.collection, write.rkey), write]))
}

/** A page of records with the writes waiting on it; created ones lead the first page */
export function overlayList(
	records: RepoRecord[],
	writes: PendingWrite[],
	first: boolean
): RepoRecord[] {
	const last = latest(writes)
	const shown = records.flatMap((record) => {
		const write = last.get(key(record.collection, record.rkey))
		if (!write) return [record]
		if (write.op === 'delete') return []
		return [asRecord(write)]
	})
	if (!first) return shown
	const known = new Set(records.map((record) => key(record.collection, record.rkey)))
	const created = [...last.values()].filter(
		(write) => write.op !== 'delete' && !known.has(key(write.collection, write.rkey))
	)
	return [...created.map(asRecord).reverse(), ...shown]
}

/** One record with the last write waiting on it: its value, or gone (undefined) */
export function overlayRecord(
	record: RepoRecord | undefined,
	writes: PendingWrite[],
	collection: string,
	rkey: string
): RepoRecord | undefined | null {
	const write = latest(writes).get(key(collection, rkey))
	if (!write) return record ?? null
	if (write.op === 'delete') return undefined
	return asRecord(write)
}
