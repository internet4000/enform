<script lang="ts">
	// An app of the atmosphere: what it is, what you can make there, and starting on it
	import * as m from '#lib/paraglide/messages.js'
	import {goto} from '$app/navigation'
	import {localIdentity} from '#lib/atproto/identity'
	import {createProfile, listProfiles} from '#lib/local/store'
	import {auth} from '#lib/auth/session.svelte'
	import {listCollections} from '#lib/atproto/repo'
	import {byDirectory, directoryTypes, typeLabel} from '#lib/apps/directory'
	import {namespaceOf} from '#lib/apps/names'
	import {startType} from '#lib/apps/start'
	import Account from '#lib/components/Account.svelte'
	import AppIcon from '#lib/components/pane/AppIcon.svelte'
	import {actorName, collectionPath, createPath, repoPath} from '#lib/paths'

	let {data} = $props()

	/** Starts on the app in a local profile (the first one, else a new one) */
	async function tryLocally(type: string) {
		const profile = (await listProfiles())[0] ?? (await createProfile(m.local_default_name()))
		await auth.useLocal(profile)
		await goto(createPath(actorName(localIdentity(profile)), type))
	}
	let info = $derived(data.info)
	let me = $derived(auth.me)
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
			<a href={info.url} rel="noopener external" target="_blank" role="button"
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
			{#if !auth.me}
				{#if auth.ready}
					{#if start}
						<p>
							<button type="button" onclick={() => tryLocally(start)}>{m.apps_try_local()}</button>
						</p>
					{/if}
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
					{:else}
						<p>{m.apps_not_yet_elsewhere({app: info.name, domain: info.domain})}</p>
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
				<!-- Known by name only: no lexicon to make a form from -->
				<enform-type-rows unpublished>
					<ul>
						{#each directoryTypes(info.namespace) as nsid (nsid)}
							<li><span><span>{typeLabel(nsid)}</span><small>{nsid}</small></span></li>
						{/each}
					</ul>
				</enform-type-rows>
				<p><small>{m.apps_unpublished_long({app: info.name})}</small></p>
			{/if}
		</section>
	{/await}
</enform-page>
