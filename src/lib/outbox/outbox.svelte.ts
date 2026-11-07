/** The writes waiting to be sent, for views to show (Settings, the header) */
import {allPending, removePending, type PendingWrite} from './store'

class Outbox {
	writes = $state.raw<PendingWrite[]>([])

	async refresh() {
		this.writes = await allPending().catch(() => [])
	}

	/** Gives up a write not sent yet (or stopped by a conflict) */
	async discard(write: PendingWrite) {
		if (write.id !== undefined) await removePending(write.id)
		await this.refresh()
	}
}

export const outbox = new Outbox()
