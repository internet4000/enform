<script lang="ts">
	// The app's main places: in thumb reach at the bottom on phones, in the header on wide screens
	import {page} from '$app/state'
	import * as m from '#lib/paraglide/messages.js'
	import {auth} from '#lib/auth/session.svelte'
	import {actorName, inApp, repoPath} from '#lib/paths'
	import {profileAvatar} from '#lib/atproto/profile'
	import Icon from './Icon.svelte'

	let me = $derived(auth.me ? repoPath(actorName(auth.me)) : undefined)
	let items = $derived([
		{href: inApp('/'), icon: 'home', label: m.nav_home()},
		{href: inApp('/explore'), icon: 'explore', label: m.nav_explore()},
		{
			href: me ?? inApp('/settings'),
			icon: 'me',
			// Who you are acting as, always in sight: your handle, or your local profile's name
			label: auth.me
				? auth.me.local
					? (auth.me.name ?? m.nav_me())
					: `@${actorName(auth.me)}`
				: m.session_sign_in()
		},
		{href: inApp('/settings'), icon: 'settings', label: m.nav_settings()}
	] as const)

	let avatar = $derived(auth.me && !auth.me.local ? profileAvatar(auth.me) : undefined)

	function current(href: string, index: number) {
		const path = page.url.pathname
		if (index === 2 && !me) return false
		if (href === inApp('/')) return path === href
		return path === href || path.startsWith(`${href}/`)
	}
</script>

<nav aria-label={m.nav_main()}>
	<ul>
		{#each items as item, index (index)}
			<li>
				<a href={item.href} aria-current={current(item.href, index) ? 'page' : undefined}>
					{#if index === 2 && avatar}
						{#await avatar then src}
							{#if src}<img {src} alt="" />{:else}<Icon name={item.icon} />{/if}
						{/await}
					{:else}
						<Icon name={item.icon} />
					{/if}
					<span>{item.label}</span>
				</a>
			</li>
		{/each}
	</ul>
</nav>
