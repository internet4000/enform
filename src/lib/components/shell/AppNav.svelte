<script lang="ts">
	// The app's main places: in thumb reach at the bottom on phones; on wide screens a
	// rail on the left, the app's icon and name at its top, your apps under the places, and who
	// you act as at its bottom. Who you are opens Settings: your profiles, switching,
	// signing in, and the rest.
	import {page} from '$app/state'
	import * as m from '#lib/paraglide/messages.js'
	import app from '#lib/config/app.json' with {type: 'json'}
	import {auth} from '#lib/auth/session.svelte'
	import {actorName, addressOf, inApp} from '#lib/paths'
	import {profileAvatar} from '#lib/atproto/profile'
	import Icon from './Icon.svelte'
	import PinnedApps from './PinnedApps.svelte'

	const places = [
		{href: inApp('/'), icon: 'home', label: m.nav_home},
		{href: inApp('/explore'), icon: 'explore', label: m.nav_explore}
	] as const
	const settings = inApp('/settings')

	/** Who you act as, always in sight: your handle, your local profile's name, or nobody yet */
	let me = $derived(auth.me ? `@${actorName(auth.me)}` : m.nav_settings())
	let avatar = $derived(auth.me && !auth.me.local ? profileAvatar(auth.me) : undefined)

	function current(href: string) {
		const path = inApp(addressOf(page.url).pathname)
		if (href === inApp('/')) return path === href
		return path === href || path.startsWith(`${href}/`)
	}
</script>

<nav aria-label={m.nav_main()}>
	<a href={inApp('/')} rel="home"><img src={inApp(app.logo)} alt="" />{app.name}</a>
	<ul>
		{#each places as place (place.href)}
			<li>
				<a href={place.href} aria-current={current(place.href) ? 'page' : undefined}>
					<Icon name={place.icon} />
					<span>{place.label()}</span>
				</a>
			</li>
		{/each}
	</ul>
	<PinnedApps />
	<ul>
		<li>
			<a href={settings} rel="me" aria-current={current(settings) ? 'page' : undefined}>
				{#await avatar then src}
					{#if src}<img {src} alt="" />{:else}<Icon name="me" />{/if}
				{/await}
				<span>{me}</span>
			</a>
		</li>
	</ul>
</nav>
