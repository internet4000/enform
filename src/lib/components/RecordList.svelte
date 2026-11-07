<script lang="ts">
	// A collection's records, a page at a time, newest first (listRecords' order)
	import * as m from '#lib/paraglide/messages.js'
	import type {Identity} from '#lib/atproto/identity'
	import {listRecords, type RepoRecord} from '#lib/atproto/repo'
	import type {LexiconDoc} from '#lib/lexicons/types'
	import {formatDate} from '#lib/dates'
	import {actorName, recordPath} from '#lib/paths'
	import {recordDate, recordSummary} from '#lib/records/summary'
	import {AtUri} from '@atproto/syntax'

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
	let cursor = $state(first.cursor)
	let loading = $state(false)
	let actor = $derived(actorName(repo))

	async function more() {
		loading = true
		try {
			const next = await listRecords(repo, collection, cursor)
			records = [...records, ...next.records]
			cursor = next.records.length ? next.cursor : undefined
		} finally {
			loading = false
		}
	}
</script>

<enform-records>
	{#await lexicon then doc}
		<ol>
			{#each records as record (record.uri)}
				{@const rkey = new AtUri(record.uri).rkey}
				{@const date = recordDate(record.value)}
				<li>
					<a href={recordPath(actor, collection, rkey)}>
						<p>{recordSummary(record.value, doc?.defs.main?.record) ?? rkey}</p>
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
