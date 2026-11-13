<script lang="ts">
	// A collection's records, a page at a time, newest first (listRecords' order)
	import {describeRecord} from '#lib/describe/record'
	import * as m from '#lib/paraglide/messages.js'
	import app from '#lib/config/app.json' with {type: 'json'}
	import type {Identity} from '#lib/atproto/identity'
	import {listRecords, type RepoRecord} from '#lib/atproto/repo'
	import type {LexiconDoc} from '#lib/lexicons/types'
	import {formatDate} from '#lib/dates'
	import {actorName, recordPath} from '#lib/paths'
	import {recordDate} from '#lib/records/summary'
	import RowSummary from './RowSummary.svelte'
	import {shownUrl} from '#lib/where.svelte'

	type Props = {
		repo: Identity
		collection: string
		lexicon: Promise<LexiconDoc | undefined>
		first: {records: RepoRecord[]; cursor?: string}
	}

	let {repo, collection, lexicon, first}: Props = $props()

	// svelte-ignore state_referenced_locally (keyed by the page: a new collection remounts)
	let records = $state(first.records)
	// svelte-ignore state_referenced_locally
	let cursor = $state(first.records.length >= app.reads.pageSize ? first.cursor : undefined)
	let loading = $state(false)
	let actor = $derived(actorName(repo))

	async function more() {
		loading = true
		try {
			const next = await listRecords(repo, collection, cursor)
			records = [...records, ...next.records]
			cursor = next.records.length >= app.reads.pageSize ? next.cursor : undefined
		} finally {
			loading = false
		}
	}
</script>

<enform-records>
	{#await lexicon then doc}
		<ol>
			{#each records as record (record.uri)}
				{@const rkey = record.rkey}
				{@const date = recordDate(record.value)}
				<li>
					<a
						href={recordPath(actor, collection, rkey)}
						aria-current={shownUrl().searchParams.get('record') === rkey ? 'page' : undefined}
					>
						<RowSummary text={describeRecord(record, doc).title ?? rkey} />
						{#if date}<time datetime={date}>{formatDate(date)}</time>{/if}
						{#if record.pending}
							<enform-pending state={record.pending}>
								{record.pending === 'conflict' ? m.outbox_conflict_short() : m.outbox_waiting()}
							</enform-pending>
						{/if}
					</a>
				</li>
			{:else}
				<li>{m.collection_records_empty()}</li>
			{/each}
		</ol>
	{/await}
	{#if cursor}
		<button type="button" onclick={more} disabled={loading} aria-busy={loading}>
			{loading ? m.collection_loading() : m.collection_load_more()}
		</button>
	{/if}
</enform-records>
