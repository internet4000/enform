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
	/** The CID written over (update, delete) */
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
