<script lang="ts">
	// Writes to your account not sent yet: sent when online, or now; a conflict (the
	// record changed elsewhere) is kept here to give up
	import {refreshAll} from '$app/navigation'
	import * as m from '#lib/paraglide/messages.js'
	import {sendWaiting} from '#lib/atproto/write'
	import {typeLabel} from '#lib/apps/directory'
	import {outbox} from '#lib/outbox/outbox.svelte'

	let sending = $state(false)

	async function send() {
		sending = true
		try {
			if ((await sendWaiting()) > 0) await refreshAll()
		} finally {
			sending = false
		}
	}

	const ops: Record<string, () => string> = {
		create: m.action_create,
		update: m.action_update,
		delete: m.action_delete
	}
</script>

<enform-outbox>
	{#if outbox.writes.length}
		<ul>
			{#each outbox.writes as write (write.id)}
				<li>
					<enform-account-item>
						<span>{ops[write.op]()} · {typeLabel(write.collection)} · {write.rkey}</span>
						{#if write.conflict}<small role="alert"
								>{m.outbox_conflict({message: write.conflict})}</small
							>{/if}
						<button type="button" onclick={() => outbox.discard(write)}>{m.outbox_discard()}</button
						>
					</enform-account-item>
				</li>
			{/each}
		</ul>
		<p>
			<button type="button" onclick={send} disabled={sending} aria-busy={sending}>
				{m.outbox_send()}
			</button>
		</p>
	{:else}
		<p><small>{m.outbox_empty()}</small></p>
	{/if}
</enform-outbox>
