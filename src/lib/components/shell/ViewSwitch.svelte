<script lang="ts">
	// A repo seen two ways, the same place in each: as its apps show it (a person, an app's
	// screen, a record in it), or as it is stored (collections and records, in panes). On
	// any page of a repo; the other view opens where one is.
	import {page} from '$app/state'
	import * as m from '#lib/paraglide/messages.js'
	import type {Identity} from '#lib/atproto/identity'
	import {appOf} from '#lib/apps/names'
	import {shownUrl} from '#lib/where.svelte'
	import {
		actorName,
		appScreenPath,
		collectionPath,
		dataPath,
		recordPath,
		repoPath
	} from '#lib/paths'

	let repo = $derived((page.data as {repo?: Identity}).repo)
	let id = $derived(page.route.id ?? '')
	let data = $derived(id.startsWith('/[actor=actor]/(data)'))

	/** Each view's address for the place at hand */
	let views = $derived.by(() => {
		if (!repo || !id.startsWith('/[actor=actor]')) return undefined
		const actor = actorName(repo)
		const {collection, rkey} = page.params
		const query = shownUrl().searchParams
		const type = query.get('type') ?? undefined
		const record = query.get('record') ?? undefined
		return {
			app: collection
				? appScreenPath(actor, appOf(collection), {type: collection, record: rkey})
				: repoPath(actor),
			data: type
				? record
					? recordPath(actor, type, record)
					: collectionPath(actor, type)
				: dataPath(actor)
		}
	})
</script>

{#if views}
	<nav aria-label={m.view_label()}>
		<a href={views.app} aria-current={data ? undefined : 'page'}>{m.view_app()}</a>
		<a href={views.data} aria-current={data ? 'page' : undefined}>{m.view_data()}</a>
	</nav>
{/if}
