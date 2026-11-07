<script lang="ts">
	// Explore: open any repo, or discover the apps of the atmosphere
	import * as m from '#lib/paraglide/messages.js'
	import {auth} from '#lib/auth/session.svelte'
	import {listCollections} from '#lib/atproto/repo'
	import {directoryApps} from '#lib/apps/directory'
	import {namespaceOf} from '#lib/apps/names'
	import ActorSearch from '#lib/components/ActorSearch.svelte'
	import AppCard from '#lib/components/AppCard.svelte'
	import {actorName, repoPath} from '#lib/paths'

	const apps = directoryApps()
	let joined = $derived(
		auth.identity
			? listCollections(auth.identity).then((all) => new Set(all.map(namespaceOf)))
			: Promise.resolve(new Set<string>())
	)
</script>

<enform-page>
	<enform-home>
		<h1>{m.app_tagline()}</h1>
		<p>{m.app_intro()}</p>
		<ActorSearch />
		{#if auth.identity}
			<p><a href={repoPath(actorName(auth.identity))} role="button">{m.home_mine()}</a></p>
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
</enform-page>
