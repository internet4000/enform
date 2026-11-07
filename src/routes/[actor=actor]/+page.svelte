<script lang="ts">
	// A person of the atmosphere: who they are, and their apps, to open like on a phone
	import * as m from '#lib/paraglide/messages.js'
	import {auth} from '#lib/auth/session.svelte'
	import {blobUrl} from '#lib/atproto/repo'
	import {appInfo} from '#lib/apps/directory'
	import {personCard} from '#lib/apps/person'
	import type {RepoApp} from '#lib/apps/types'
	import AppIconLink from '#lib/components/launcher/AppIconLink.svelte'
	import {actorName, appScreenPath, dataPath} from '#lib/paths'

	let {data} = $props()
	let actor = $derived(actorName(data.repo))
	let owner = $derived(auth.owns(data.repo))

	/** The apps people use: the protocol's own plumbing apart */
	const shown = (apps: RepoApp[]) =>
		apps
			.map((app) => ({app, info: appInfo(app.namespace)}))
			.filter(({info}) => !info.protocol)
			.sort(
				(a, b) =>
					Number(b.info.known) - Number(a.info.known) || a.info.name.localeCompare(b.info.name)
			)
</script>

<enform-page>
	<enform-person>
		{#await data.apps then apps}
			{@const card = personCard(apps)}
			{#if card?.banner}<img src={blobUrl(data.repo, card.banner)} alt="" />{/if}
			<figure>
				{#if card?.avatar}<img src={blobUrl(data.repo, card.avatar)} alt="" />{/if}
				<figcaption>
					<h1>{card?.title ?? data.repo.name ?? `@${actor}`}</h1>
					<p>{data.repo.local ? m.local_on_device() : `@${actor}`}</p>
					{#if card?.text}<p>{card.text}</p>{/if}
				</figcaption>
			</figure>
		{/await}
	</enform-person>

	<section aria-labelledby="apps">
		<h2 id="apps">{owner ? m.person_your_apps() : m.person_apps()}</h2>
		{#await data.apps}
			<p><small>{m.collection_loading()}</small></p>
		{:then apps}
			<enform-launcher>
				{#each shown(apps) as { app, info } (app.namespace)}
					<AppIconLink href={appScreenPath(actor, app.app)} domain={info.domain} name={info.name} />
				{/each}
				{#if owner}
					<enform-app-link add>
						<a href="/explore"><span aria-hidden="true">+</span><span>{m.person_add_app()}</span></a
						>
					</enform-app-link>
				{/if}
			</enform-launcher>
			{#if shown(apps).length === 0}<p>{m.repo_collections_empty()}</p>{/if}
		{/await}
	</section>

	<p><small><a href={dataPath(actor)}>{m.person_all_data()}</a></small></p>
</enform-page>
