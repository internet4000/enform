<script lang="ts">
	// A collection's pane: its records, newest first; the owner can add one
	import * as m from '#lib/paraglide/messages.js'
	import {auth} from '#lib/auth/session.svelte'
	import {appInfo, typeLabel} from '#lib/apps/directory'
	import {namespaceOf} from '#lib/apps/names'
	import RecordList from '#lib/components/RecordList.svelte'
	import Pane from '#lib/components/pane/Pane.svelte'
	import {actorName, createPath, repoPath} from '#lib/paths'

	let {data, children} = $props()
	let actor = $derived(actorName(data.repo))
	let owner = $derived(auth.owns(data.repo))
	let app = $derived(appInfo(namespaceOf(data.collection)))
</script>

<Pane
	title={typeLabel(data.collection)}
	subtitle={`${app.name} · ${data.collection}`}
	back={{href: repoPath(actor), label: `@${actor}`}}
>
	{#snippet actions()}
		{#if owner}
			{#await data.lexicon then doc}
				{#if doc}
					<li>
						<a href={createPath(actor, data.collection)} role="button">{m.collection_add()}</a>
					</li>
				{/if}
			{/await}
		{/if}
	{/snippet}
	{#key data.page}
		<RecordList
			repo={data.repo}
			collection={data.collection}
			lexicon={data.lexicon}
			first={data.page}
		/>
	{/key}
</Pane>
{@render children()}
