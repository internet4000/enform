<script lang="ts">
	// No record chosen: the space where one opens, or, with ?new, the form to create one
	import {page} from '$app/state'
	import * as m from '#lib/paraglide/messages.js'
	import {typeLabel} from '#lib/apps/directory'
	import CreateRecord from '#lib/components/CreateRecord.svelte'
	import Pane from '#lib/components/pane/Pane.svelte'
	import {actorName, collectionPath} from '#lib/paths'

	let {data} = $props()
	let actor = $derived(actorName(data.repo))
	let creating = $derived(page.url.searchParams.has('new'))
</script>

{#if creating}
	<Pane
		title={m.new_record_title({collection: typeLabel(data.collection)})}
		back={{href: collectionPath(actor, data.collection), label: typeLabel(data.collection)}}
	>
		{#await data.lexicon then lexicon}
			{#if lexicon}
				<CreateRecord {lexicon} />
			{:else}
				<p>{m.lexicon_missing({nsid: data.collection})}</p>
			{/if}
		{/await}
	</Pane>
{:else}
	<Pane title={m.pane_pick_title()} placeholder>
		<p>{m.pane_pick_record()}</p>
	</Pane>
{/if}
