<script lang="ts">
	// Who you act as and where your records are kept: on this device, or on your account's
	// server (with what enform may do there). Your page and signing out are Settings' rows
	import * as m from '#lib/paraglide/messages.js'
	import {auth} from '#lib/auth/session.svelte'
	import {grants} from '#lib/auth/describe'
	import {actorName} from '#lib/paths'

	let me = $derived(auth.me)
	let server = $derived(me?.pds ? new URL(me.pds).host : undefined)
	let granted = $derived(grants(auth.scope))

	const actionNames: Record<string, () => string> = {
		create: m.action_create,
		update: m.action_update,
		delete: m.action_delete
	}
</script>

<enform-you local={me?.local ? '' : undefined}>
	{#if !me}
		<p>{m.you_nobody()}</p>
	{:else}
		<p>
			<strong>@{actorName(me)}</strong>
			{me.local ? m.you_local() : m.you_account({server: server ?? ''})}
		</p>
		{#if !me.local && auth.session}
			<details>
				<summary>{m.account_permissions()}</summary>
				<ul>
					<li>{m.account_permission_identity()}</li>
					{#each granted as grant, index (index)}
						<li>
							{#if grant.kind === 'repo'}
								{@const actions = grant.actions.map((a) => actionNames[a]?.() ?? a).join(', ')}
								{grant.collections.includes('*')
									? m.account_permission_repo_all({actions})
									: m.account_permission_repo({
											actions,
											collections: grant.collections.join(', ')
										})}
							{:else if grant.kind === 'identity'}
								{m.account_permission_handle()}
							{:else}
								{m.account_permission_blob({accept: grant.accept.join(', ')})}
							{/if}
						</li>
					{/each}
				</ul>
				<p><small>{m.account_permissions_hint()}</small></p>
			</details>
		{/if}
	{/if}
</enform-you>
