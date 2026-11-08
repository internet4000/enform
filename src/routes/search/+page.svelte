<script lang="ts">
	// What a search matches: the person with that handle, the apps whose name, domain or
	// description has it, the lexicon with that NSID. All in the URL (?q=).
	import {page} from '$app/state'
	import {isValidHandle, isValidNsid} from '@atproto/syntax'
	import * as m from '#lib/paraglide/messages.js'
	import {resolveIdentity} from '#lib/atproto/identity'
	import {directoryApps} from '#lib/apps/directory'
	import {resolveLexicon} from '#lib/lexicons/resolve'
	import AppCard from '#lib/components/AppCard.svelte'
	import IdentityChip from '#lib/components/IdentityChip.svelte'
	import {lexiconPath} from '#lib/paths'

	let query = $derived(page.url.searchParams.get('q')?.trim() ?? '')
	let bare = $derived(query.replace(/^@/, '').toLowerCase())

	let apps = $derived(
		bare
			? directoryApps().filter((app) =>
					[app.name, app.domain, app.description ?? ''].some((text) =>
						text.toLowerCase().includes(bare)
					)
				)
			: []
	)
	let person = $derived(
		isValidHandle(bare) ? resolveIdentity(bare).catch(() => undefined) : Promise.resolve(undefined)
	)
	let lexicon = $derived(
		isValidNsid(bare)
			? resolveLexicon(bare)
					.then(() => bare)
					.catch(() => undefined)
			: Promise.resolve(undefined)
	)
	let found = $derived(Promise.all([person, lexicon]))
</script>

<svelte:head><title>{query ? `${query} · ` : ''}{m.search_title()}</title></svelte:head>

<enform-page>
	<h1>{query ? m.search_results({query}) : m.search_title()}</h1>
	{#if !query}
		<p>{m.search_hint()}</p>
	{:else}
		{#await found}
			<p role="status"><small>{m.collection_loading()}</small></p>
		{:then [identity, nsid]}
			{#if identity}
				<section aria-labelledby="people">
					<h2 id="people">{m.search_people()}</h2>
					<IdentityChip actor={identity.did} />
				</section>
			{/if}
			{#if apps.length}
				<section aria-labelledby="apps">
					<h2 id="apps">{m.apps_title()}</h2>
					<enform-app-cards>
						{#each apps as app (app.namespace)}<AppCard {app} />{/each}
					</enform-app-cards>
				</section>
			{/if}
			{#if nsid}
				<section aria-labelledby="lexicons">
					<h2 id="lexicons">{m.search_lexicons()}</h2>
					<p><a href={lexiconPath(nsid)}>{nsid}</a></p>
				</section>
			{/if}
			{#if !identity && !apps.length && !nsid}
				<p>{m.search_nothing({query})}</p>
				<p><small>{m.search_hint()}</small></p>
			{/if}
		{/await}
	{/if}
</enform-page>
