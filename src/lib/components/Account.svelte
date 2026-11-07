<script lang="ts">
	// Sign in (identity only), or the signed-in account and what it has allowed enform to do
	import {page} from '$app/state'
	import * as m from '#lib/paraglide/messages.js'
	import {auth} from '#lib/auth/session.svelte'
	import {signInRedirect} from '#lib/auth/client'
	import {grants} from '#lib/auth/describe'
	import {actorName, repoPath} from '#lib/paths'

	let {returnTo}: {returnTo?: string} = $props()

	let handle = $state('')
	let pending = $state(false)
	let failed = $state<string>()
	let granted = $derived(grants(auth.scope))

	const actionNames: Record<string, () => string> = {
		create: m.action_create,
		update: m.action_update,
		delete: m.action_delete
	}

	async function signIn(event: SubmitEvent) {
		event.preventDefault()
		pending = true
		failed = undefined
		try {
			const back = returnTo ?? page.url.pathname + page.url.search
			await signInRedirect(handle.trim().replace(/^@/, ''), back)
		} catch (err) {
			failed = (err as Error).message
			pending = false
		}
	}
</script>

<enform-account signed-in={!!auth.session || undefined}>
	{#if auth.session}
		{@const actor = auth.identity ? actorName(auth.identity) : auth.session.did}
		<p>{m.account_signed_in_as()} <a href={repoPath(actor)}>@{actor}</a></p>
		<h3>{m.account_permissions()}</h3>
		<ul>
			<li>{m.account_permission_identity()}</li>
			{#each granted as grant, index (index)}
				<li>
					{#if grant.kind === 'repo'}
						{@const actions = grant.actions.map((a) => actionNames[a]?.() ?? a).join(', ')}
						{grant.collections.includes('*')
							? m.account_permission_repo_all({actions})
							: m.account_permission_repo({actions, collections: grant.collections.join(', ')})}
					{:else}
						{m.account_permission_blob({accept: grant.accept.join(', ')})}
					{/if}
				</li>
			{/each}
		</ul>
		<p><small>{m.account_permissions_hint()}</small></p>
		<button type="button" onclick={() => auth.signOut()}>{m.session_sign_out()}</button>
	{:else if auth.ready}
		<p>{m.session_sign_in_hint()}</p>
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
					inputmode="email"
					enterkeyhint="go"
					required
				/>
			</label>
			<button type="submit" disabled={pending} aria-busy={pending}>{m.session_sign_in()}</button>
		</form>
		{#if failed}<p role="alert">{failed}</p>{/if}
	{/if}
</enform-account>
