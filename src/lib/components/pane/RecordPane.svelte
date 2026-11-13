<script lang="ts">
	// A record's pane: shown through its lexicon; editing, its form, for the owner
	import * as m from '#lib/paraglide/messages.js'
	import type {LexiconDoc} from '#lib/lexicons/types'
	import type {Identity} from '#lib/atproto/identity'
	import type {RepoRecord} from '#lib/atproto/repo'
	import {auth} from '#lib/auth/session.svelte'
	import {typeLabel} from '#lib/apps/directory'
	import EditRecord from '#lib/components/EditRecord.svelte'
	import RecordActions from '#lib/components/RecordActions.svelte'
	import RecordValue from '#lib/components/RecordValue.svelte'
	import RecordMenu from '#lib/components/RecordMenu.svelte'
	import AnswerActions from '#lib/components/AnswerActions.svelte'
	import {recordSummary} from '#lib/records/summary'
	import {actorName, collectionPath, editPath, inApp, recordPath} from '#lib/paths'
	import Pane from './Pane.svelte'

	type Props = {
		repo: Identity
		collection: string
		rkey: string
		lexicon: Promise<LexiconDoc | undefined>
		record: RepoRecord
		editing?: boolean
	}
	let {repo, collection, rkey, lexicon, record, editing = false}: Props = $props()
	let actor = $derived(actorName(repo))
	let owner = $derived(auth.owns(repo))
	let label = $derived(typeLabel(collection))
	// A link (to a record or a person) isn't a title: the type names it then
	let summary = $derived(recordSummary(record.value))
	let title = $derived(summary && !/^(at:\/\/|did:)/.test(summary) ? summary : label)
</script>

{#if editing && owner}
	<Pane
		title={m.edit_title()}
		subtitle={title}
		back={{href: recordPath(actor, collection, rkey), label: title}}
	>
		{#await lexicon then doc}
			{#if doc}
				<EditRecord lexicon={doc} {actor} {rkey} {record} />
			{/if}
		{/await}
	</Pane>
{:else}
	<Pane {title} subtitle={label} back={{href: collectionPath(actor, collection), label}}>
		{#snippet actions()}
			<AnswerActions {repo} {record} bare />
			{#await lexicon then doc}
				<RecordMenu {repo} nsid={collection} uri={record.uri} lexicon={doc} value={record.value} />
			{/await}
			{#if owner}
				<RecordActions
					{actor}
					{collection}
					{rkey}
					cid={record.cid}
					editHref={editPath(actor, collection, rkey)}
				/>
			{/if}
		{/snippet}
		{#if record.pending}
			<p role="status"><a href={inApp('/settings/waiting')}>{m.outbox_record_waiting()}</a></p>
		{/if}
		<enform-record>
			{#await lexicon}
				<RecordValue value={record.value} base={collection} {repo} typed={false} />
			{:then doc}
				<RecordValue
					value={record.value}
					node={doc?.defs.main?.record}
					base={collection}
					{repo}
					typed={false}
				/>
			{/await}
		</enform-record>
		<details>
			<summary>{m.record_raw()}</summary>
			<pre>{JSON.stringify(record, null, 2)}</pre>
		</details>
	</Pane>
{/if}
