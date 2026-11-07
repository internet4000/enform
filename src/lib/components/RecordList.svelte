<script lang="ts">
	// A collection's records, a page at a time, newest first (listRecords' order)
	import * as m from '#lib/paraglide/messages.js'
	import app from '#lib/config/app.json' with {type: 'json'}
	import type {Identity} from '#lib/atproto/identity'
	import {listRecords, type RepoRecord} from '#lib/atproto/repo'
	import type {LexiconDoc} from '#lib/lexicons/types'
	import {formatDate} from '#lib/dates'
	import {actorName, recordPath} from '#lib/paths'
	import {recordDate, recordSummary} from '#lib/records/summary'
	import RowSummary from './RowSummary.svelte'
	import {page} from '$app/state'

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
						aria-current={page.params.rkey === rkey ? 'page' : undefined}
					>
						<RowSummary text={recordSummary(record.value, doc?.defs.main?.record) ?? rkey} />
						{#if date}<time datetime={date}>{formatDate(date)}</time>{/if}
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
