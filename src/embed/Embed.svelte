<script lang="ts">
	// A profile on any page (docs/embed.md). With an app: their home in it (the app, their
	// picture, name, handle and words there, a shelf per type their repo has in it) and the
	// reader to play or read them. Without: their apps, as icons, each opening its home
	// here. Read from the repo's own PDS in the visitor's browser; read-only, each record
	// linking to its page in enform.
	import * as m from '#lib/paraglide/messages.js'
	import {resolveIdentity, type Identity} from '#lib/atproto/identity'
	import {blobUrl, listCollections} from '#lib/atproto/repo'
	import {profileAvatar} from '#lib/atproto/profile'
	import {repoApps} from '#lib/apps/apps'
	import {appInfo, byDirectory} from '#lib/apps/directory'
	import {namespaceOfDomain} from '#lib/apps/names'
	import type {RepoApp} from '#lib/apps/types'
	import {recordCard} from '#lib/records/card'
	import {actorName, appPath, appScreenPath, repoPath} from '#lib/paths'
	import AppIcon from '#lib/components/pane/AppIcon.svelte'
	import TypeShelf from '#lib/components/app/TypeShelf.svelte'
	import Reader from '#lib/components/reader/Reader.svelte'

	/** Whose profile (a handle or a DID), and in which app (its domain), if one */
	let {actor, app}: {actor: string; app?: string} = $props()

	/** The app shown: the one named, else the one chosen among theirs */
	let chosen = $state<string>()
	let domain = $derived(app ?? chosen)

	let found = $derived(
		resolveIdentity(actor).then(async (repo) => ({
			repo,
			apps: await repoApps(repo, await listCollections(repo))
		}))
	)

	/** Their apps, those they have records in: by name */
	const theirs = (apps: RepoApp[]) =>
		apps
			.filter((one) => one.lists.some((type) => type.used) || one.profile?.record)
			.sort((a, b) => appInfo(a.namespace).name.localeCompare(appInfo(b.namespace).name))

	/** A plain click opens the app here; a click for a new tab opens it in enform */
	function open(event: MouseEvent, to: string) {
		if (event.metaKey || event.ctrlKey || event.shiftKey || event.button !== 0) return
		event.preventDefault()
		chosen = to
	}
</script>

{#snippet person(repo: Identity, one?: RepoApp)}
	{@const name = actorName(repo)}
	{@const card = one?.profile?.record
		? recordCard(one.profile.record.value, one.profile.lexicon?.defs.main?.record)
		: undefined}
	{@const avatar =
		card?.avatar && !repo.local ? Promise.resolve(blobUrl(repo, card.avatar)) : profileAvatar(repo)}
	<enform-embed-profile>
		{#await avatar then src}{#if src}<img {src} alt="" />{/if}{/await}
		<hgroup>
			<h1>{card?.title ?? `@${name}`}</h1>
			{#if card?.title}<p>@{name}</p>{/if}
		</hgroup>
	</enform-embed-profile>
	{#if card?.text}<p>{card.text}</p>{/if}
{/snippet}

<enform-embed-page>
	{#await found}
		<p><small>{m.collection_loading()}</small></p>
	{:then { repo, apps }}
		{@const name = actorName(repo)}
		{#if domain}
			{@const one = apps.find((each) => each.app === domain)}
			{@const info = appInfo(one?.namespace ?? namespaceOfDomain(domain))}
			<header>
				<nav>
					{#if !app}
						<button type="button" onclick={() => (chosen = undefined)}
							>← {m.embed_all_apps()}</button
						>
					{/if}
					<a href={appPath(domain)}>
						<AppIcon {domain} name={info.name} />
						<strong>{info.name}</strong>
					</a>
				</nav>
				{@render person(repo, one)}
			</header>
			{#if one}
				{#each byDirectory(one.lists.filter((type) => type.used)) as type (type.nsid)}
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
		{:else}
			<header>{@render person(repo)}</header>
			<!-- Their apps, as icons: each opens its home here -->
			<enform-launcher aria-label={m.embed_apps()}>
				{#each theirs(apps) as one (one.namespace)}
					{@const info = appInfo(one.namespace)}
					<enform-app-link>
						<a href={appScreenPath(name, one.app)} onclick={(event) => open(event, one.app)}>
							<AppIcon domain={one.app} name={info.name} />
							<span>{info.name}</span>
							{#if info.name.toLowerCase() !== one.app}<small>{one.app}</small>{/if}
						</a>
					</enform-app-link>
				{/each}
			</enform-launcher>
			<footer>
				<a href={repoPath(name)}>{m.embed_open()} ↗</a>
			</footer>
		{/if}
	{:catch}
		<p>{m.embed_failed({actor})}</p>
	{/await}
</enform-embed-page>
<Reader />
