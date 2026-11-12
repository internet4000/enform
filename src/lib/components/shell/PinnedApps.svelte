<script lang="ts">
	// Your apps, in the rail: the ones you pinned, and the profiles in them, in your order;
	// until you pin one, the apps you have records in, as suggestions (never decided for you)
	import {page} from '$app/state'
	import * as m from '#lib/paraglide/messages.js'
	import {auth} from '#lib/auth/session.svelte'
	import {listCollections} from '#lib/atproto/repo'
	import {appInfo} from '#lib/apps/directory'
	import {appOf, namespaceOf, namespaceOfDomain} from '#lib/apps/names'
	import {pins} from '#lib/apps/pins.svelte'
	import {pinnedProfile} from '#lib/apps/pinned'
	import type {Pin} from '#lib/apps/pins'
	import {actorName, addressOf, appPath, appScreenPath, inApp} from '#lib/paths'
	import AppIcon from '../pane/AppIcon.svelte'

	/** The apps you have records in, by domain, the protocol's own left out */
	let used = $derived(
		auth.me
			? listCollections(auth.me)
					.then((collections) =>
						[...new Set(collections.map(namespaceOf))]
							.filter((namespace) => !appInfo(namespace).protocol)
							.map((namespace) => appOf(`${namespace}.x`))
					)
					.catch(() => [])
			: Promise.resolve([])
	)

	/** Your screen of the app when you are someone, else its page */
	const href = (domain: string) =>
		auth.me ? appScreenPath(actorName(auth.me), domain) : appPath(domain)
	const nameOf = (domain: string) => appInfo(namespaceOfDomain(domain)).name

	const current = (domain: string) => addressOf(page.url).pathname.endsWith(`/apps/${domain}`)
	const here = (href: string) => inApp(decodeURIComponent(addressOf(page.url).pathname)) === href
</script>

{#snippet pinned(all: Pin[])}
	<ul>
		{#each all as pin (`${pin.did ?? ''}/${pin.domain}`)}
			{@const name = nameOf(pin.domain)}
			<li>
				{#if pin.did}
					{#await pinnedProfile({did: pin.did, domain: pin.domain}) then profile}
						<a
							href={profile.href}
							aria-current={here(profile.href) ? 'page' : undefined}
							title={`${profile.actor} · ${name}`}
						>
							<AppIcon domain={pin.domain} {name} />
							<span>{profile.actor}</span>
						</a>
					{/await}
				{:else}
					<a href={href(pin.domain)} aria-current={current(pin.domain) ? 'page' : undefined}>
						<AppIcon domain={pin.domain} {name} />
						<span>{name}</span>
					</a>
				{/if}
			</li>
		{/each}
	</ul>
{/snippet}

{#snippet list(domains: string[])}
	<ul>
		{#each domains as domain (domain)}
			{@const name = nameOf(domain)}
			<li>
				<a href={href(domain)} aria-current={current(domain) ? 'page' : undefined}>
					<AppIcon {domain} {name} />
					<span>{name}</span>
				</a>
			</li>
		{/each}
	</ul>
{/snippet}

<section aria-labelledby="pins-title">
	<h2 id="pins-title">{m.pins_title()}</h2>
	{#if pins.keys.length}
		{@render pinned(pins.all)}
	{:else}
		{#await used then domains}
			{#if domains.length}
				<p><small>{m.pins_suggested()}</small></p>
				{@render list(domains)}
			{/if}
		{/await}
	{/if}
	<a href={inApp('/explore')} rel="search">+ {m.pins_add()}</a>
</section>
