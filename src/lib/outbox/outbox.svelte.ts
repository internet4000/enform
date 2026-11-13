/** The writes waiting to be sent, for views to show (Settings, the header) */
import {allPending, getPending, passSwap, removePending, type PendingWrite} from './store'

class Outbox {
	writes = $state.raw<PendingWrite[]>([])

	async refresh() {
		this.writes = await allPending().catch(() => [])
	}

	/**
	 * Gives up a write not sent yet (or stopped by a conflict): the next write of its
	 * record swaps against the version this one would have written over
	 */
	async discard(write: PendingWrite) {
		if (write.id === undefined) return
		const current = (await getPending(write.id)) ?? write
		await passSwap(current, current.swap)
		await removePending(write.id)
		await this.refresh()
	}
}

export const outbox = new Outbox()
