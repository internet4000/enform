<script lang="ts">
	// Who you act as and where your records are kept: on this device, or on your account's
	// server (with what enform may do there); your page; going back or signing out
	import * as m from '#lib/paraglide/messages.js'
	import {auth} from '#lib/auth/session.svelte'
	import {grants} from '#lib/auth/describe'
	import {profileAvatar} from '#lib/atproto/profile'
	import {actorName, repoPath} from '#lib/paths'

	let me = $derived(auth.me)
	let avatar = $derived(me && !me.local ? profileAvatar(me) : undefined)
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
		{@const actor = actorName(me)}
		<a href={repoPath(actor)}>
			{#await avatar then src}
				{#if src}<img {src} alt="" />{/if}
			{/await}
			<span>
				<strong>{me.local ? (me.name ?? m.local_on_device()) : `@${actor}`}</strong>
				<small>{m.account_your_page()}</small>
			</span>
		</a>
		<p>{me.local ? m.you_local() : m.you_account({server: server ?? ''})}</p>
		<menu>
			{#if me.local && auth.identity}
				<li>
					<button type="button" onclick={() => auth.useLocal(undefined)}
						>{m.you_use_account({actor: `@${actorName(auth.identity)}`})}</button
					>
				</li>
			{:else if !me.local}
				<li>
					<button type="button" onclick={() => auth.signOut()}>{m.session_sign_out()}</button>
				</li>
			{/if}
		</menu>
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
