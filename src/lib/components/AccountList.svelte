<script lang="ts">
	// The accounts signed in on this browser: the current one marked, the others to switch to
	import * as m from '#lib/paraglide/messages.js'
	import {auth} from '#lib/auth/session.svelte'
	import {profileAvatar} from '#lib/atproto/profile'
	import {actorName, repoPath} from '#lib/paths'

	let busy = $state<string>()
	let failed = $state<string>()

	async function run(did: string, action: (did: string) => Promise<void>) {
		busy = did
		failed = undefined
		try {
			await action(did)
		} catch (err) {
			failed = (err as Error).message
		} finally {
			busy = undefined
		}
	}
</script>

<enform-accounts>
	<ul>
		{#each auth.accounts as account (account.did)}
			{@const actor = account.identity ? actorName(account.identity) : account.did}
			{@const current = !auth.local && account.did === auth.did}
			<li>
				<enform-account-item
					current={current || undefined}
					busy={busy === account.did || undefined}
				>
					{#if account.identity}
						{#await profileAvatar(account.identity) then src}
							{#if src}<img {src} alt="" loading="lazy" />{/if}
						{/await}
					{/if}
					<a href={repoPath(actor)} aria-current={current || undefined}>@{actor}</a>
					{#if current}
						<small>{m.accounts_current()}</small>
					{:else}
						<button
							type="button"
							disabled={!!busy}
							aria-label={m.accounts_switch_to({actor})}
							onclick={() => run(account.did, (did) => auth.switchTo(did))}
						>
							{m.accounts_switch()}
						</button>
					{/if}
					<button
						type="button"
						disabled={!!busy}
						aria-label={m.accounts_sign_out_of({actor})}
						onclick={() => run(account.did, (did) => auth.signOut(did))}
					>
						{m.session_sign_out()}
					</button>
				</enform-account-item>
			</li>
		{/each}
	</ul>
	{#if failed}<p role="alert">{failed}</p>{/if}
</enform-accounts>
