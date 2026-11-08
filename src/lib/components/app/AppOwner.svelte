<script lang="ts">
	// Whose app screen this is, first and large: their avatar and name as this app shows
	// them (its profile record: a radio's name and image, a display name), else their
	// account's; their handle, always; and what they say about themselves there
	import * as m from '#lib/paraglide/messages.js'
	import type {Identity} from '#lib/atproto/identity'
	import {blobUrl} from '#lib/atproto/repo'
	import {profileAvatar} from '#lib/atproto/profile'
	import type {RepoApp} from '#lib/apps/types'
	import {actorName, repoPath} from '#lib/paths'
	import {recordCard} from '#lib/records/card'

	let {repo, app}: {repo: Identity; app: RepoApp} = $props()

	let handle = $derived(repo.local ? (repo.name ?? m.local_on_device()) : `@${actorName(repo)}`)
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
	<a href={repoPath(actorName(repo))} rel="author">
		{#await avatar then src}
			{#if src}<img {src} alt="" />{/if}
		{/await}
		<hgroup>
			<h1>{name ?? handle}</h1>
			{#if name}<p>{handle}</p>{/if}
		</hgroup>
	</a>
	{#if card?.text}<p>{card.text}</p>{/if}
</enform-app-owner>
