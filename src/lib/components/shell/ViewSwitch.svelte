<script lang="ts">
	// A repo seen two ways at the same address: as its apps show it, or as it is stored
	// (the data view, the same address under /data). Switching keeps one's place: the
	// person, the app, the type and the record open.
	import {page} from '$app/state'
	import * as m from '#lib/paraglide/messages.js'
	import type {Identity} from '#lib/atproto/identity'
	import {shownUrl} from '#lib/where.svelte'
	import {actorName, appScreenPath, dataPath, dataScreenPath, repoPath} from '#lib/paths'

	let repo = $derived((page.data as {repo?: Identity}).repo)
	let id = $derived(page.route.id ?? '')
	let data = $derived(id.startsWith('/data/'))

	/** Each view's address for the place at hand */
	let views = $derived.by(() => {
		if (!repo || !/^\/(data\/)?\[actor=actor\]/.test(id)) return undefined
		const actor = actorName(repo)
		const app = page.params.app
		const query = shownUrl().searchParams
		const open = {
			type: query.get('type') ?? undefined,
			record: query.get('record') ?? undefined
		}
		return app
			? {app: appScreenPath(actor, app, open), data: dataScreenPath(actor, app, open)}
			: {app: repoPath(actor), data: dataPath(actor)}
	})
</script>

{#if views}
	<nav aria-label={m.view_switch()}>
		<a href={views.app} aria-current={data ? undefined : 'page'}>{m.view_app()}</a>
		<a href={views.data} aria-current={data ? 'page' : undefined}>{m.view_data()}</a>
	</nav>
{/if}
