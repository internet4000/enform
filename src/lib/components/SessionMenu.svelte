<script lang="ts">
	// Sign in (identity only), or the signed-in account with a link to its repo
	import {page} from '$app/state'
	import * as m from '#lib/paraglide/messages.js'
	import {auth} from '#lib/auth/session.svelte'
	import {signInRedirect} from '#lib/auth/client'
	import {actorName, repoPath} from '#lib/paths'

	let handle = $state('')
	let pending = $state(false)
	let failed = $state<string>()

	async function signIn(event: SubmitEvent) {
		event.preventDefault()
		pending = true
		failed = undefined
		try {
			await signInRedirect(handle.trim().replace(/^@/, ''), page.url.pathname + page.url.search)
		} catch (err) {
			failed = (err as Error).message
			pending = false
		}
	}
</script>

<enform-session signed-in={!!auth.session || undefined} ready={auth.ready || undefined}>
	{#if auth.session}
		{@const actor = auth.identity ? actorName(auth.identity) : auth.session.did}
		<a href={repoPath(actor)}>@{actor}</a>
		<button type="button" onclick={() => auth.signOut()}>{m.session_sign_out()}</button>
	{:else if auth.ready}
		<form onsubmit={signIn}>
			<label>
				{m.session_handle_label()}
				<input
					type="text"
					bind:value={handle}
					placeholder={m.actor_search_placeholder()}
					autocapitalize="off"
					autocomplete="username"
					spellcheck="false"
					required
				/>
			</label>
			<button type="submit" disabled={pending} aria-busy={pending}>{m.session_sign_in()}</button>
		</form>
		{#if failed}<p role="alert">{failed}</p>{/if}
	{/if}
</enform-session>
