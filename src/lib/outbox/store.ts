/**
 * Writes to an account not sent yet (docs/local-first.md): kept in this browser, in
 * order, until its PDS takes them. Each keeps the version it swaps against.
 */
import {OUTBOX, run} from '#lib/local/db'

export type PendingWrite = {
	id?: number
	/** The account's DID */
	did: string
	op: 'create' | 'update' | 'delete'
	collection: string
	rkey: string
	value?: Record<string, unknown>
	/**
	 * The CID written over (update, delete). A write queued after another of the same
	 * record gets it when that one is sent, or given up (`passSwap`)
	 */
	swap?: string
	/** A conflict: the record changed elsewhere, so this write stopped */
	conflict?: string
	createdAt: string
}

export function allPending(): Promise<PendingWrite[]> {
	return run<PendingWrite[]>(OUTBOX, 'readonly', (store) => store.getAll())
}

export async function pendingFor(did: string, collection?: string): Promise<PendingWrite[]> {
	return (await allPending()).filter(
		(write) => write.did === did && (!collection || write.collection === collection)
	)
}

export function enqueue(write: Omit<PendingWrite, 'id' | 'createdAt'>): Promise<IDBValidKey> {
	return run(OUTBOX, 'readwrite', (store) =>
		store.add({...write, createdAt: new Date().toISOString()})
	)
}

export function removePending(id: number) {
	return run(OUTBOX, 'readwrite', (store) => store.delete(id))
}

export async function markConflict(write: PendingWrite, message: string) {
	await run(OUTBOX, 'readwrite', (store) => store.put({...write, conflict: message}))
}

export function getPending(id: number): Promise<PendingWrite | undefined> {
	return run<PendingWrite | undefined>(OUTBOX, 'readonly', (store) => store.get(id))
}

/**
 * Hands the version of a record to the next write of it still waiting: the CID a sent
 * write made (none once deleted), or, for a write given up, the one it would have
 * written over. Kept with that write, so it holds if sending stops in between.
 */
export async function passSwap(write: PendingWrite, swap: string | undefined) {
	if (write.id === undefined) return
	const next = (await pendingFor(write.did, write.collection)).find(
		(other) => other.rkey === write.rkey && other.id !== undefined && other.id > write.id!
	)
	if (next) await run(OUTBOX, 'readwrite', (store) => store.put({...next, swap}))
}
