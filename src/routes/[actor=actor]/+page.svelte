<script lang="ts">
	// A person of the atmosphere: who they are, and their apps as cards, each with what they
	// have in it (its record types, named from the directory or their NSID)
	import * as m from '#lib/paraglide/messages.js'
	import {auth} from '#lib/auth/session.svelte'
	import {blobUrl} from '#lib/atproto/repo'
	import {appInfo, byDirectory, typeLabel} from '#lib/apps/directory'
	import {personCard} from '#lib/apps/person'
	import type {RepoApp} from '#lib/apps/types'
	import AppIcon from '#lib/components/pane/AppIcon.svelte'
	import {actorName, appScreenPath, dataPath, inApp} from '#lib/paths'

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
	/** What they have in an app: its types with records */
	const had = (app: RepoApp) =>
		byDirectory(
			[...(app.profile?.record ? [app.profile] : []), ...app.lists, ...app.singles].filter(
				(type) => type.used || type === app.profile
			)
		)
			.map((type) => typeLabel(type.nsid))
			.join(' · ')
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
			<enform-app-cards>
				{#each shown(apps) as { app, info } (app.namespace)}
					<enform-app-card>
						<a href={appScreenPath(actor, app.app)}>
							<AppIcon domain={info.domain} name={info.name} />
							<strong>{info.name}</strong>
							<p>{had(app)}</p>
							{#if info.name.toLowerCase() !== info.domain}<small>{info.domain}</small>{/if}
						</a>
					</enform-app-card>
				{/each}
				{#if owner}
					<enform-app-card add>
						<a href={inApp('/explore')}>
							<span aria-hidden="true">+</span>
							<strong>{m.person_add_app()}</strong>
						</a>
					</enform-app-card>
				{/if}
			</enform-app-cards>
			{#if shown(apps).length === 0}<p>{m.repo_collections_empty()}</p>{/if}
		{/await}
	</section>

	<p><small><a href={dataPath(actor)}>{m.person_all_data()}</a></small></p>
</enform-page>
