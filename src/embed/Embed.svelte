<script lang="ts">
	// A profile's home in an app, on any page (docs/embed.md): the app, whose profile it
	// is (its picture, name, handle and words), a shelf per type its repo has there, and
	// the reader to play or read them. Read from the repo's own PDS in the visitor's
	// browser; read-only, each record linking to its page in enform.
	import * as m from '#lib/paraglide/messages.js'
	import {resolveIdentity} from '#lib/atproto/identity'
	import {blobUrl, listCollections} from '#lib/atproto/repo'
	import {profileAvatar} from '#lib/atproto/profile'
	import {repoApps} from '#lib/apps/apps'
	import {appInfo, byDirectory} from '#lib/apps/directory'
	import {namespaceOfDomain} from '#lib/apps/names'
	import {recordCard} from '#lib/records/card'
	import {actorName, appPath, appScreenPath} from '#lib/paths'
	import AppIcon from '#lib/components/pane/AppIcon.svelte'
	import TypeShelf from '#lib/components/app/TypeShelf.svelte'
	import Reader from '#lib/components/reader/Reader.svelte'

	/** Whose profile (a handle or a DID), in which app (its domain) */
	let {actor, app: domain}: {actor: string; app: string} = $props()

	let info = $derived(appInfo(namespaceOfDomain(domain)))
	let found = $derived(
		resolveIdentity(actor).then(async (repo) => {
			const apps = await repoApps(repo, await listCollections(repo))
			return {repo, app: apps.find((app) => app.app === domain)}
		})
	)
</script>

<enform-embed-page>
	{#await found}
		<p><small>{m.collection_loading()}</small></p>
	{:then { repo, app }}
		{@const name = actorName(repo)}
		{@const card = app?.profile?.record
			? recordCard(app.profile.record.value, app.profile.lexicon?.defs.main?.record)
			: undefined}
		{@const avatar =
			card?.avatar && !repo.local
				? Promise.resolve(blobUrl(repo, card.avatar))
				: profileAvatar(repo)}
		<header>
			<a href={appPath(domain)}>
				<AppIcon {domain} name={info.name} />
				<strong>{info.name}</strong>
			</a>
			<enform-embed-profile>
				{#await avatar then src}{#if src}<img {src} alt="" />{/if}{/await}
				<hgroup>
					<h1>{card?.title ?? `@${name}`}</h1>
					{#if card?.title}<p>@{name}</p>{/if}
				</hgroup>
			</enform-embed-profile>
			{#if card?.text}<p>{card.text}</p>{/if}
		</header>
		{#if app}
			{#each byDirectory(app.lists.filter((type) => type.used)) as type (type.nsid)}
				<TypeShelf
					{repo}
					{type}
					all={appScreenPath(name, domain, {type: type.nsid})}
					href={(rkey) => appScreenPath(name, domain, {type: type.nsid, record: rkey})}
				/>
			{/each}
		{:else}
			<p>{m.app_screen_empty({app: info.name})}</p>
		{/if}
		<footer>
			<a href={appScreenPath(name, domain)}>{m.embed_open()} ↗</a>
		</footer>
	{:catch}
		<p>{m.embed_failed({actor, app: domain})}</p>
	{/await}
</enform-embed-page>
<Reader />
