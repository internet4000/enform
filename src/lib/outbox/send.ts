/**
 * Sends an account's waiting writes in order (docs/local-first.md). Each swaps against
 * the version the write before it made, so nothing changed elsewhere is overwritten:
 * a conflict or a refusal stops that write, and the later writes of its record wait
 * behind it; an unreachable PDS stops them all.
 */
import {isNetworkFailure} from '#lib/atproto/xrpc'
import {
	getPending,
	markConflict,
	passSwap,
	pendingFor,
	removePending,
	type PendingWrite
} from './store'

/** Sends one write, swapping against `swap`; answers the CID it made, if any */
export type Send = (write: PendingWrite, swap: string | undefined) => Promise<string | undefined>

export async function sendPending(did: string, send: Send): Promise<number> {
	const held = new Set<string>()
	let sent = 0
	for (const {id} of await pendingFor(did)) {
		// Read each write when its turn comes: the one before may have passed it its swap
		const write = id === undefined ? undefined : await getPending(id)
		if (!write) continue
		const record = `${write.collection}/${write.rkey}`
		if (write.conflict || held.has(record)) {
			held.add(record)
			continue
		}
		try {
			const cid = await send(write, write.swap || undefined)
			await passSwap(write, cid)
			await removePending(write.id!)
			sent++
		} catch (err) {
			if (isNetworkFailure(err)) break
			await markConflict(write, (err as Error).message)
			held.add(record)
		}
	}
	return sent
}
