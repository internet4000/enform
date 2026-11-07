<script lang="ts">
	// An app of a repo, as a tile: its profile's picture and name, and what it holds
	import * as m from '#lib/paraglide/messages.js'
	import type {Identity} from '#lib/atproto/identity'
	import {blobUrl} from '#lib/atproto/repo'
	import type {RepoApp} from '#lib/apps/types'
	import {recordCard} from '#lib/records/card'
	import {appPath} from '#lib/paths'
	import {plural} from '#lib/plural'

	let {repo, actor, app}: {repo: Identity; actor: string; app: RepoApp} = $props()

	let card = $derived(
		app.profile?.record
			? recordCard(app.profile.record.value, app.profile.lexicon?.defs.main?.record)
			: undefined
	)
	let lists = $derived(app.lists.filter((list) => list.used).length)
</script>

<enform-app-tile>
	<a href={appPath(actor, app.app)}>
		{#if card?.avatar}
			<img src={blobUrl(repo, card.avatar)} alt="" loading="lazy" />
		{:else}
			<span aria-hidden="true">{app.app.slice(0, 1).toUpperCase()}</span>
		{/if}
		<strong>{app.app}</strong>
		<small>
			{#if card?.title}{card.title} ·{/if}
			{plural(lists, {
				one: () => m.app_lists_one({count: String(lists)}),
				other: () => m.app_lists({count: String(lists)})
			})}
		</small>
	</a>
</enform-app-tile>
