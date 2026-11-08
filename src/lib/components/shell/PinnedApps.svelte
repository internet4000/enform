<script lang="ts">
	// Your apps, in the rail: the ones you pinned, in your order; until you pin one, the
	// apps you have records in, as suggestions (never decided for you)
	import {page} from '$app/state'
	import * as m from '#lib/paraglide/messages.js'
	import {auth} from '#lib/auth/session.svelte'
	import {listCollections} from '#lib/atproto/repo'
	import {appInfo} from '#lib/apps/directory'
	import {appOf, namespaceOf, namespaceOfDomain} from '#lib/apps/names'
	import {pins} from '#lib/apps/pins.svelte'
	import {actorName, appPath, appScreenPath, inApp} from '#lib/paths'
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

	const current = (domain: string) => page.url.pathname.endsWith(`/apps/${domain}`)
</script>

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
	{#if pins.domains.length}
		{@render list(pins.domains)}
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
