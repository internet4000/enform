<script lang="ts">
	// Whose profile this is, as the app shows it: the avatar and name of their profile
	// record in this app when they have one (a radio's name, a display name), and always
	// their handle, so the account is never in doubt
	import type {Identity} from '#lib/atproto/identity'
	import {blobUrl} from '#lib/atproto/repo'
	import type {RepoApp} from '#lib/apps/types'
	import {actorName} from '#lib/paths'
	import {recordCard} from '#lib/records/card'

	/** Without href, shown, not a link (when something beside it opens it) */
	type Props = {repo: Identity; app?: RepoApp; href?: string; rel?: string}
	let {repo, app, href, rel}: Props = $props()

	let handle = $derived(`@${actorName(repo)}`)
	let card = $derived(
		app?.profile?.record
			? recordCard(app.profile.record.value, app.profile.lexicon?.defs.main?.record)
			: undefined
	)
	let avatar = $derived(card?.avatar && !repo.local ? blobUrl(repo, card.avatar) : undefined)
	let name = $derived(card?.title && card.title !== handle ? card.title : undefined)
</script>

<enform-app-profile>
	<svelte:element this={href ? 'a' : 'div'} {href} {rel}>
		{#if avatar}<img src={avatar} alt="" />{/if}
		{#if name}
			<span><strong>{name}</strong> <small>{handle}</small></span>
		{:else}
			<span>{handle}</span>
		{/if}
	</svelte:element>
</enform-app-profile>
