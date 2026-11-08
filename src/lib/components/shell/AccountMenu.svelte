<script lang="ts">
	// Who you act as, at the bottom of the rail, and everything about it in one menu: your
	// page, the other accounts to switch to, signing out, and the rest in More
	import * as m from '#lib/paraglide/messages.js'
	import {auth} from '#lib/auth/session.svelte'
	import {profileAvatar} from '#lib/atproto/profile'
	import {actorName, inApp, repoPath} from '#lib/paths'
	import Icon from './Icon.svelte'

	const id = $props.id()
	let menu = $state<HTMLElement>()
	let me = $derived(auth.me)
	let name = $derived(
		me ? (me.local ? (me.name ?? m.nav_me()) : `@${actorName(me)}`) : m.session_sign_in()
	)
	let avatar = $derived(me && !me.local ? profileAvatar(me) : undefined)
	let others = $derived(auth.accounts.filter((account) => account.did !== auth.did || auth.local))

	async function run(action: () => Promise<void>) {
		menu?.hidePopover()
		await action()
	}
</script>

{#if me}
	<enform-account-menu>
		<button type="button" popovertarget="{id}-account" aria-label={m.account_menu({actor: name})}>
			{#await avatar then src}
				{#if src}<img {src} alt="" />{:else}<Icon name="me" />{/if}
			{/await}
			<span>{name}</span>
		</button>
		<enform-menu id="{id}-account" popover="auto" bind:this={menu}>
			<ul>
				<li>
					<a href={repoPath(actorName(me))} onclick={() => menu?.hidePopover()}
						>{m.account_your_page()}</a
					>
				</li>
				{#each others as account (account.did)}
					{@const actor = account.identity ? actorName(account.identity) : account.did}
					<li>
						<button type="button" onclick={() => run(() => auth.switchTo(account.did))}>
							{m.accounts_switch_to({actor: `@${actor}`})}
						</button>
					</li>
				{/each}
				<li>
					<a href={inApp('/more#account')} onclick={() => menu?.hidePopover()}
						>{m.account_manage()}</a
					>
				</li>
				{#if auth.session && !me.local}
					<li>
						<button type="button" onclick={() => run(() => auth.signOut())}>
							{m.session_sign_out()}
						</button>
					</li>
				{/if}
			</ul>
		</enform-menu>
	</enform-account-menu>
{:else if auth.ready}
	<enform-account-menu>
		<a href={inApp('/more#account')}>{m.session_sign_in()}</a>
	</enform-account-menu>
{/if}
