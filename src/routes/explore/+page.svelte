<script lang="ts">
	// Explore: the apps of the atmosphere, known and discovered (search is on top)
	import * as m from '#lib/paraglide/messages.js'
	import {auth} from '#lib/auth/session.svelte'
	import {listCollections} from '#lib/atproto/repo'
	import {directoryApps} from '#lib/apps/directory'
	import {namespaceOf} from '#lib/apps/names'
	import AppCard from '#lib/components/AppCard.svelte'
	import DiscoveredApps from '#lib/components/DiscoveredApps.svelte'
	import {actorName, repoPath} from '#lib/paths'

	const apps = directoryApps()
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
	</section>

	<section aria-labelledby="discover">
		<h2 id="discover">{m.discover_title()}</h2>
		<DiscoveredApps />
	</section>
</enform-page>
