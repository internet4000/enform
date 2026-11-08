<script lang="ts">
	// An app's records of one type, as cards, a page at a time, newest first
	import * as m from '#lib/paraglide/messages.js'
	import app from '#lib/config/app.json' with {type: 'json'}
	import type {Identity} from '#lib/atproto/identity'
	import {listRecords, type RepoRecord} from '#lib/atproto/repo'
	import type {LexiconDoc} from '#lib/lexicons/types'
	import {capabilitiesOf, plays} from '#lib/capabilities/detect'
	import {reader, type ReaderItem} from '#lib/reader/reader.svelte'
	import AppRecordCard from './AppRecordCard.svelte'

	type Props = {
		repo: Identity
		collection: string
		lexicon?: LexiconDoc
		href: (rkey: string) => string
		open?: string
	}
	let {repo, collection, lexicon, href, open}: Props = $props()

	let records = $state<RepoRecord[]>([])
	let cursor = $state<string>()
	let loading = $state(true)

	async function load(more = false) {
		loading = true
		try {
			const page = await listRecords(repo, collection, more ? cursor : undefined)
			records = more ? [...records, ...page.records] : page.records
			cursor = page.records.length >= app.reads.pageSize ? page.cursor : undefined
		} finally {
			loading = false
		}
	}

	const toItems = (list: RepoRecord[]): ReaderItem[] =>
		list.map((record) => ({repo, record, lexicon, href: href(record.rkey)}))

	/** Read (or play) the list from a record on, its next pages as the reader gets there */
	function read(index = 0) {
		let next = cursor
		reader.start(toItems(records), index, async () => {
			if (!next) return []
			const page = await listRecords(repo, collection, next)
			next = page.records.length >= app.reads.pageSize ? page.cursor : undefined
			return toItems(page.records)
		})
	}

	let playable = $derived(records.some((record) => plays(capabilitiesOf(record.value, lexicon))))

	$effect(() => {
		void collection
		void repo.did
		load()
	})
</script>

{#if records.length}
	<p>
		<button type="button" onclick={() => read()}>
			{playable ? m.reader_play_all() : m.reader_read_all()}
		</button>
	</p>
{/if}
<enform-record-grid>
	{#each records as record (record.rkey)}
		<AppRecordCard
			{repo}
			{record}
			{lexicon}
			href={href(record.rkey)}
			current={open === record.rkey}
		/>
	{:else}
		{#if !loading}<p>{m.collection_records_empty()}</p>{/if}
	{/each}
</enform-record-grid>
{#if loading}<p><small>{m.collection_loading()}</small></p>{/if}
{#if cursor && !loading}
	<button type="button" onclick={() => load(true)}>{m.collection_load_more()}</button>
{/if}
