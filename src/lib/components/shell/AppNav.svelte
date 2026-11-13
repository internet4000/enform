<script lang="ts">
	// The app's main places: in thumb reach at the bottom on phones; on wide screens a
	// rail on the left, the app's icon and name at its top, your apps under the places, and who
	// you act as at its bottom: your profile (your repo), then Settings (your profiles,
	// switching, signing in, and the rest). New creates a record of any type.
	import {page} from '$app/state'
	import * as m from '#lib/paraglide/messages.js'
	import app from '#lib/config/app.json' with {type: 'json'}
	import {auth} from '#lib/auth/session.svelte'
	import {actorName, addressOf, inApp, newPath, repoPath} from '#lib/paths'
	import {profileAvatar} from '#lib/atproto/profile'
	import Icon from './Icon.svelte'
	import PinnedApps from './PinnedApps.svelte'

	const places = [
		{href: inApp('/'), icon: 'home', label: m.nav_home},
		{href: inApp('/explore'), icon: 'explore', label: m.nav_explore},
		{href: newPath(), icon: 'new', label: m.nav_new}
	] as const
	const settings = inApp('/settings')
	/** Beside the app's page, which is always its folder (addresses are after `#`) */
	const logo = app.logo.replace(/^\//, '')

	/** Who you act as, always in sight: your handle, or your local profile's name */
	let me = $derived(auth.me ? `@${actorName(auth.me)}` : undefined)
	let profile = $derived(auth.me ? repoPath(actorName(auth.me)) : undefined)
	let avatar = $derived(auth.me && !auth.me.local ? profileAvatar(auth.me) : undefined)

	function current(href: string) {
		const path = inApp(addressOf(page.url).pathname)
		if (href === inApp('/')) return path === href
		return path === href || path.startsWith(`${href}/`)
	}
</script>

<nav aria-label={m.nav_main()}>
	<a href={inApp('/')} rel="home"><img src={logo} alt="" />{app.name}</a>
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
		{#if profile}
			<li>
				<a href={profile} rel="me" title={me} aria-current={current(profile) ? 'page' : undefined}>
					{#await avatar then src}
						{#if src}<img {src} alt="" />{:else}<Icon name="me" />{/if}
					{/await}
					<span>{m.nav_profile()}</span>
				</a>
			</li>
		{/if}
		<li>
			<a href={settings} aria-current={current(settings) ? 'page' : undefined}>
				<Icon name="settings" />
				<span>{m.nav_settings()}</span>
			</a>
		</li>
	</ul>
</nav>
