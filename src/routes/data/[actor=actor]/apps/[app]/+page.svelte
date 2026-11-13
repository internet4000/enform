<script lang="ts">
	// An app's data, as stored: with ?type, a collection's records; with &record, one of
	// them (&edit, its form); with &new, the form to create one. The app view's addresses.
	import {NSID} from '@atproto/syntax'
	import * as m from '#lib/paraglide/messages.js'
	import {shownUrl} from '#lib/where.svelte'
	import {getRecord, listRecords} from '#lib/atproto/repo'
	import {resolveLexicon} from '#lib/lexicons/resolve'
	import {appInfo, typeLabel} from '#lib/apps/directory'
	import {namespaceOfDomain} from '#lib/apps/names'
	import CollectionOverview from '#lib/components/CollectionOverview.svelte'
	import CreateRecord from '#lib/components/CreateRecord.svelte'
	import CollectionPane from '#lib/components/pane/CollectionPane.svelte'
	import RecordPane from '#lib/components/pane/RecordPane.svelte'
	import Pane from '#lib/components/pane/Pane.svelte'
	import {actorName, collectionPath, dataScreenPath} from '#lib/paths'

	let {data, params} = $props()
	let actor = $derived(actorName(data.repo))
	let query = $derived(shownUrl().searchParams)
	let type = $derived.by(() => {
		const value = query.get('type')
		return value && NSID.isValid(value) ? value : undefined
	})
	let rkey = $derived(query.get('record') ?? undefined)
	let creating = $derived(query.has('new'))
	let editing = $derived(query.has('edit'))
	let app = $derived(appInfo(namespaceOfDomain(params.app)))

	// Read again when the type changes, or after a write (the load ran again)
	let lexicon = $derived(type ? resolveLexicon(type).catch(() => undefined) : undefined)
	let list = $derived.by(() => {
		void data.read
		return type ? listRecords(data.repo, type) : undefined
	})
	let record = $derived.by(() => {
		void data.read
		return type && rkey ? getRecord(data.repo, type, rkey) : undefined
	})
</script>

{#if type && lexicon && list}
	<CollectionPane
		repo={data.repo}
		collection={type}
		{lexicon}
		{list}
		back={{href: dataScreenPath(actor, params.app), label: app.name}}
	/>
	{#if creating}
		<Pane
			title={m.new_record_title({collection: typeLabel(type)})}
			back={{href: collectionPath(actor, type), label: typeLabel(type)}}
		>
			{#await lexicon then doc}
				{#if doc}
					<CreateRecord lexicon={doc} />
				{:else}
					<p>{m.lexicon_missing({nsid: type})}</p>
				{/if}
			{/await}
		</Pane>
	{:else if rkey && record}
		{#await record}
			<Pane
				title={typeLabel(type)}
				back={{href: collectionPath(actor, type), label: typeLabel(type)}}
			>
				<p><small>{m.collection_loading()}</small></p>
			</Pane>
		{:then found}
			<RecordPane repo={data.repo} collection={type} {rkey} {lexicon} record={found} {editing} />
		{:catch err}
			<Pane
				title={typeLabel(type)}
				back={{href: collectionPath(actor, type), label: typeLabel(type)}}
			>
				<p role="alert">{err.message}</p>
			</Pane>
		{/await}
	{:else}
		<!-- No record open: on wide screens, what this collection is -->
		<Pane title={typeLabel(type)} placeholder>
			<CollectionOverview repo={data.repo} collection={type} {lexicon} />
		</Pane>
	{/if}
{:else}
	<Pane title={m.pane_pick_title()} placeholder>
		<p>{m.pane_pick_collection()}</p>
	</Pane>
{/if}
