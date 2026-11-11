<script lang="ts">
	// Where one is, as a breadcrumb: the app (its icon, name and domain), then whose profile
	// in it, the page itself: their avatar and name as this app shows them (its profile
	// record: a radio's name and image, a display name), else their account's; their
	// handle, to their page across apps; each pinnable; under it, what they say about themselves there
	import * as m from '#lib/paraglide/messages.js'
	import type {Identity} from '#lib/atproto/identity'
	import {blobUrl} from '#lib/atproto/repo'
	import {profileAvatar} from '#lib/atproto/profile'
	import type {AppInfo} from '#lib/apps/directory'
	import type {RepoApp} from '#lib/apps/types'
	import {actorName, appPath, repoPath} from '#lib/paths'
	import {recordCard} from '#lib/records/card'
	import AppIcon from '#lib/components/pane/AppIcon.svelte'
	import PinButton from '#lib/components/PinButton.svelte'

	let {repo, app, info}: {repo: Identity; app: RepoApp; info: AppInfo} = $props()

	let handle = $derived(`@${actorName(repo)}`)
	let card = $derived(
		app.profile?.record
			? recordCard(app.profile.record.value, app.profile.lexicon?.defs.main?.record)
			: undefined
	)
	let avatar = $derived(
		repo.local
			? Promise.resolve(undefined)
			: card?.avatar
				? Promise.resolve(blobUrl(repo, card.avatar))
				: profileAvatar(repo)
	)
	let name = $derived(card?.title && card.title !== handle ? card.title : undefined)
</script>

<enform-app-owner>
	<nav aria-label={m.nav_breadcrumb()}>
		<ol>
			<li>
				<a href={appPath(info.domain)}>
					<AppIcon domain={info.domain} name={info.name} />
					<strong>{info.name}</strong>
				</a>
				{#if info.name.toLowerCase() !== info.domain}<small>{info.domain}</small>{/if}
				<PinButton domain={info.domain} name={info.name} />
			</li>
			<li aria-current="page">
				<!-- Their avatar, to their page across apps -->
				<a href={repoPath(actorName(repo))} rel="author" aria-label={handle}>
					{#await avatar then src}
						{#if src}<img {src} alt="" />{:else}<span aria-hidden="true">@</span>{/if}
					{/await}
				</a>
				<hgroup>
					<h1>{name ?? handle}</h1>
					<!-- Whose it is, by their handle alone: who you act as is in the shell -->
					{#if name}<p>{handle}</p>{/if}
				</hgroup>
				{#if !repo.local}
					<PinButton domain={info.domain} name={info.name} did={repo.did} actor={handle} />
				{/if}
			</li>
		</ol>
	</nav>
	{#if card?.text}<p>{card.text}</p>{/if}
</enform-app-owner>
