<script lang="ts">
	// An app of the atmosphere: what it is, what you can make there, and starting on it
	import * as m from '#lib/paraglide/messages.js'
	import {auth} from '#lib/auth/session.svelte'
	import {listCollections} from '#lib/atproto/repo'
	import {byDirectory, typeLabel} from '#lib/apps/directory'
	import {namespaceOf} from '#lib/apps/names'
	import {startType} from '#lib/apps/start'
	import Account from '#lib/components/Account.svelte'
	import AppIcon from '#lib/components/pane/AppIcon.svelte'
	import {actorName, collectionPath, createPath, repoPath} from '#lib/paths'

	let {data} = $props()
	let info = $derived(data.info)
	let me = $derived(auth.identity)
	let mine = $derived(
		me
			? listCollections(me).then((all) =>
					all.filter((nsid) => namespaceOf(nsid) === info.namespace)
				)
			: Promise.resolve([])
	)
</script>

<enform-page>
	<enform-app-hero>
		<AppIcon domain={info.domain} name={info.name} />
		<hgroup>
			<h1>{info.name}</h1>
			{#if info.description}<p>{info.description}</p>{/if}
		</hgroup>
		{#if info.url}
			<a href={info.url} rel="noopener external" target="_blank"
				>{m.apps_visit({domain: info.domain})}</a
			>
		{/if}
	</enform-app-hero>

	{#await data.app}
		<p>{m.collection_loading()}</p>
	{:then app}
		{@const start = startType(app)}
		<section aria-labelledby="start">
			<h2 id="start">{m.apps_your_place()}</h2>
			{#if !auth.session}
				{#if auth.ready}
					<p>{m.apps_sign_in({app: info.name})}</p>
					<Account />
				{/if}
			{:else if me}
				{#await mine then collections}
					{#if collections.length}
						<p>{m.apps_joined_long({app: info.name})}</p>
						<ul>
							{#each collections as nsid (nsid)}
								<li><a href={collectionPath(actorName(me), nsid)}>{typeLabel(nsid)}</a></li>
							{/each}
						</ul>
						<p><a href={repoPath(actorName(me))} role="button">{m.apps_open_repo()}</a></p>
					{:else if start}
						<p>{m.apps_not_yet({app: info.name})}</p>
						<p>
							<a href={createPath(actorName(me), start)} role="button">
								{m.apps_start({type: typeLabel(start)})}
							</a>
						</p>
					{/if}
				{/await}
			{/if}
		</section>

		<section aria-labelledby="types">
			<h2 id="types">{m.apps_types()}</h2>
			{#if app.published}
				<enform-type-rows>
					<ul>
						{#each byDirectory( [...(app.profile ? [app.profile] : []), ...app.lists, ...app.singles] ) as type (type.nsid)}
							<li>
								<a href={me ? createPath(actorName(me), type.nsid) : `/lexicon/${type.nsid}`}>
									<span>{typeLabel(type.nsid)}</span>
									<small>{type.lexicon?.defs.main?.description ?? type.nsid}</small>
								</a>
							</li>
						{/each}
					</ul>
				</enform-type-rows>
			{:else}
				<p>{m.app_unpublished({app: info.name})}</p>
			{/if}
		</section>
	{/await}
</enform-page>
