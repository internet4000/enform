<script lang="ts">
	// Explore: the apps of the atmosphere, known and discovered; the search field narrows
	// them here as one types (?q=), and searches everywhere once its chip is removed
	import * as m from '#lib/paraglide/messages.js'
	import {shownUrl} from '#lib/where.svelte'
	import {auth} from '#lib/auth/session.svelte'
	import {listCollections} from '#lib/atproto/repo'
	import {directoryApps} from '#lib/apps/directory'
	import {namespaceOf} from '#lib/apps/names'
	import AppCard from '#lib/components/AppCard.svelte'
	import DiscoveredApps from '#lib/components/DiscoveredApps.svelte'
	import {matchesWords} from '#lib/records/filters'
	import {appInfo} from '#lib/apps/directory'
	import {exampleNamespaces, exampleTypes} from '#lib/lexicons/examples/index'
	import {actorName, repoPath, searchResultsPath} from '#lib/paths'

	const all = directoryApps()
	let query = $derived(shownUrl().searchParams.get('q')?.trim() ?? '')
	let apps = $derived(
		query
			? all.filter((app) => matchesWords(query, app.name, app.domain, app.description ?? ''))
			: all
	)
	let joined = $derived(
		auth.me
			? listCollections(auth.me).then((all) => new Set(all.map(namespaceOf)))
			: Promise.resolve(new Set<string>())
	)
</script>

<enform-page>
	<enform-home>
		<h1>{m.app_tagline()}</h1>
		<p>{m.app_intro()}</p>
		{#if auth.me}
			<p><a href={repoPath(actorName(auth.me))} role="button">{m.home_mine()}</a></p>
		{/if}
	</enform-home>

	<section aria-labelledby="apps">
		<h2 id="apps">{m.apps_title()}</h2>
		<p>{m.apps_intro()}</p>
		<enform-app-cards>
			{#await joined then mine}
				{#each apps as app (app.namespace)}
					<AppCard {app} joined={mine.has(app.namespace)} />
				{/each}
			{/await}
		</enform-app-cards>
		{#if !apps.length}
			<p>
				{m.records_filtered_none()}
				<a href={searchResultsPath(query)}>{m.search_everywhere_for({query})}</a>
			</p>
		{/if}
	</section>

	<section aria-labelledby="discover">
		<h2 id="discover">{m.discover_title()}</h2>
		<DiscoveredApps />
	</section>

	<!-- Apps made from their types alone, to try on this device (docs/examples.md) -->
	<section aria-labelledby="examples">
		<h2 id="examples">{m.examples_title()}</h2>
		<p>{m.examples_intro()}</p>
		<enform-app-cards>
			{#each exampleNamespaces as namespace (namespace)}
				<AppCard app={appInfo(namespace)} count={exampleTypes(namespace).length} />
			{/each}
		</enform-app-cards>
	</section>
</enform-page>
