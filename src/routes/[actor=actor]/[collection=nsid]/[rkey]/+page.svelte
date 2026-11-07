<script lang="ts">
	// A record's pane: shown through its lexicon; with ?edit, its form, for the owner
	import {page} from '$app/state'
	import * as m from '#lib/paraglide/messages.js'
	import {auth} from '#lib/auth/session.svelte'
	import {typeLabel} from '#lib/apps/directory'
	import EditRecord from '#lib/components/EditRecord.svelte'
	import RecordActions from '#lib/components/RecordActions.svelte'
	import RecordValue from '#lib/components/RecordValue.svelte'
	import RecordMenu from '#lib/components/RecordMenu.svelte'
	import Pane from '#lib/components/pane/Pane.svelte'
	import {recordSummary} from '#lib/records/summary'
	import {actorName, collectionPath, editPath, recordPath} from '#lib/paths'

	let {data} = $props()
	let actor = $derived(actorName(data.repo))
	let owner = $derived(auth.owns(data.repo))
	let editing = $derived(owner && page.url.searchParams.has('edit'))
	let label = $derived(typeLabel(data.collection))
	// A link (to a record or a person) isn't a title: the type names it then
	let summary = $derived(recordSummary(data.record.value))
	let title = $derived(summary && !/^(at:\/\/|did:)/.test(summary) ? summary : label)
</script>

{#if editing}
	<Pane
		title={m.edit_title()}
		subtitle={title}
		back={{href: recordPath(actor, data.collection, data.rkey), label: title}}
	>
		{#await data.lexicon then lexicon}
			{#if lexicon}
				<EditRecord {lexicon} {actor} rkey={data.rkey} record={data.record} />
			{/if}
		{/await}
	</Pane>
{:else}
	<Pane {title} subtitle={label} back={{href: collectionPath(actor, data.collection), label}}>
		{#snippet actions()}
			{#await data.lexicon then lexicon}
				<RecordMenu
					repo={data.repo}
					nsid={data.collection}
					uri={data.record.uri}
					{lexicon}
					value={data.record.value}
				/>
			{/await}
			{#if owner}
				<RecordActions
					{actor}
					collection={data.collection}
					rkey={data.rkey}
					cid={data.record.cid}
					editHref={editPath(actor, data.collection, data.rkey)}
				/>
			{/if}
		{/snippet}
		<enform-record>
			{#await data.lexicon}
				<RecordValue
					value={data.record.value}
					base={data.collection}
					repo={data.repo}
					typed={false}
				/>
			{:then lexicon}
				<RecordValue
					value={data.record.value}
					node={lexicon?.defs.main?.record}
					base={data.collection}
					repo={data.repo}
					typed={false}
				/>
			{/await}
		</enform-record>
		<details>
			<summary>{m.record_raw()}</summary>
			<pre>{JSON.stringify(data.record, null, 2)}</pre>
		</details>
	</Pane>
{/if}
