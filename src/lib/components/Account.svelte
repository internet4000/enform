<script lang="ts">
	// The current account and what it has allowed enform to do, every account signed in
	// on this browser, and signing in (another) one
	import * as m from '#lib/paraglide/messages.js'
	import {auth} from '#lib/auth/session.svelte'
	import {grants} from '#lib/auth/describe'
	import {actorName, repoPath} from '#lib/paths'
	import AccountList from './AccountList.svelte'
	import SignIn from './SignIn.svelte'

	let {returnTo}: {returnTo?: string} = $props()

	let granted = $derived(grants(auth.scope))

	const actionNames: Record<string, () => string> = {
		create: m.action_create,
		update: m.action_update,
		delete: m.action_delete
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
					{:else if grant.kind === 'identity'}
						{m.account_permission_handle()}
					{:else}
						{m.account_permission_blob({accept: grant.accept.join(', ')})}
					{/if}
				</li>
			{/each}
		</ul>
		<p><small>{m.account_permissions_hint()}</small></p>
	{/if}
	{#if auth.accounts.length}
		<h3>{m.accounts_switch_title()}</h3>
		<AccountList />
	{/if}
	{#if auth.ready}
		{#if auth.session}<h3>{m.accounts_add()}</h3>{/if}
		<SignIn {returnTo} adding={!!auth.session} />
	{/if}
</enform-account>
