<script lang="ts">
	import * as m from '#lib/paraglide/messages.js'
	import {appDomains} from '#lib/apps/apps'
	import AppTile from '#lib/components/AppTile.svelte'
	import {actorName, appPath} from '#lib/paths'

	let {data} = $props()
	let actor = $derived(actorName(data.repo))
</script>

<enform-repo verified={!!data.repo.handle || undefined}>
	<h1>@{actor}</h1>
	<p>
		<small>
			<code>{data.repo.did}</code> · {m.repo_pds()}
			{new URL(data.repo.pds).host}
			{#if !data.repo.handle}· {m.repo_handle_unverified()}{/if}
		</small>
	</p>
</enform-repo>

<section aria-labelledby="apps">
	<h2 id="apps">{m.repo_apps()}</h2>
	<enform-app-tiles>
		{#await data.apps}
			{#each appDomains(data.collections) as app (app)}
				<enform-app-tile loading>
					<a href={appPath(actor, app)}>
						<span aria-hidden="true">{app.slice(0, 1).toUpperCase()}</span>
						<strong>{app}</strong>
					</a>
				</enform-app-tile>
			{/each}
		{:then apps}
			{#each apps as app (app.app)}
				<AppTile repo={data.repo} {actor} {app} />
			{/each}
		{/await}
	</enform-app-tiles>
	{#if data.collections.length === 0}
		<p>{m.repo_collections_empty()}</p>
	{/if}
</section>
