<script lang="ts">
	// The app's main places: in thumb reach at the bottom on phones, in the header on wide screens
	import {page} from '$app/state'
	import * as m from '#lib/paraglide/messages.js'
	import {auth} from '#lib/auth/session.svelte'
	import {actorName, repoPath} from '#lib/paths'
	import Icon from './Icon.svelte'

	let me = $derived(
		auth.session ? repoPath(auth.identity ? actorName(auth.identity) : auth.session.did) : undefined
	)
	let items = $derived([
		{href: '/', icon: 'explore', label: m.nav_explore()},
		{href: '/following', icon: 'following', label: m.nav_following()},
		{href: '/new', icon: 'new', label: m.nav_new()},
		{href: me ?? '/settings', icon: 'me', label: me ? m.nav_me() : m.session_sign_in()},
		{href: '/settings', icon: 'settings', label: m.nav_settings()}
	] as const)

	function current(href: string, index: number) {
		const path = page.url.pathname
		if (index === 3 && !me) return false
		if (href === '/') return path === '/'
		return path === href || path.startsWith(`${href}/`)
	}
</script>

<nav aria-label={m.nav_main()}>
	<ul>
		{#each items as item, index (index)}
			<li>
				<a href={item.href} aria-current={current(item.href, index) ? 'page' : undefined}>
					<Icon name={item.icon} />
					<span>{item.label}</span>
				</a>
			</li>
		{/each}
	</ul>
</nav>
