<script lang="ts">
	// Privacy and security: where your records are kept, what enform may do on your
	// account (only what you have done needed), and that what is on this device stays there
	import * as m from '#lib/paraglide/messages.js'
	import {auth} from '#lib/auth/session.svelte'
	import {grants} from '#lib/auth/describe'
	import SettingsHeader from '#lib/components/SettingsHeader.svelte'

	let me = $derived(auth.me)
	let server = $derived(me?.pds ? new URL(me.pds).host : undefined)
	let granted = $derived(grants(auth.scope))

	const actionNames: Record<string, () => string> = {
		create: m.action_create,
		update: m.action_update,
		delete: m.action_delete
	}
</script>

<enform-page>
	<SettingsHeader title={m.privacy_title()} />
	{#if !me}
		<p>{m.privacy_nobody()}</p>
	{:else}
		<p>{me.local ? m.you_local() : m.you_account({server: server ?? ''})}</p>
	{/if}
	{#if me && !me.local && auth.session}
		<section aria-labelledby="permissions">
			<h2 id="permissions">{m.account_permissions()}</h2>
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
		</section>
	{/if}
	<p>{m.privacy_device()}</p>
</enform-page>
