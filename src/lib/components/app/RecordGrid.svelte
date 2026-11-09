<script lang="ts">
	// An app's records of one type, as cards, a page at a time, newest first; over them, a
	// toolbar: how many are shown, in which order, read or play them all, and what the page
	// adds (+ New); then the filters its lexicon offers. The search field and the filters
	// narrow the records loaded so far, from the URL (?q=, ?f.<field>=, ?sort=)
	import type {Snippet} from 'svelte'
	import {goto} from '$app/navigation'
	import {page} from '$app/state'
	import * as m from '#lib/paraglide/messages.js'
	import {shownUrl} from '#lib/where.svelte'
	import app from '#lib/config/app.json' with {type: 'json'}
	import type {Identity} from '#lib/atproto/identity'
	import {listRecords, type RepoRecord} from '#lib/atproto/repo'
	import type {LexiconDoc} from '#lib/lexicons/types'
	import {capabilitiesOf, plays} from '#lib/capabilities/detect'
	import {reader, type ReaderItem} from '#lib/reader/reader.svelte'
	import {fieldLabel} from '#lib/forms/labels'
	import {applyFilters, cleared, facetsOf, readFilters, sorted, sortsOf} from '#lib/records/filters'
	import {typeLabel} from '#lib/apps/directory'
	import {actorName, searchResultsPath} from '#lib/paths'
	import AppRecordCard from './AppRecordCard.svelte'
	import RecordFilters from './RecordFilters.svelte'

	type Props = {
		repo: Identity
		collection: string
		lexicon?: LexiconDoc
		href: (rkey: string) => string
		open?: string
		/** The page's own actions, at the toolbar's end */
		actions?: Snippet
	}
	let {repo, collection, lexicon, href, open, actions}: Props = $props()

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

	let node = $derived(lexicon?.defs.main?.record)
	let filters = $derived(readFilters(shownUrl().searchParams))
	let shown = $derived(applyFilters(node, records, filters))
	let facets = $derived(facetsOf(node, records))
	let sorts = $derived(sortsOf(node))
	let narrowed = $derived(shown.length !== records.length || Object.keys(filters.is).length > 0)
	let changed = $derived(narrowed || !!filters.q || filters.sort !== 'newest')

	const sortLabel = (key: string, field?: string) =>
		key === 'newest'
			? m.sort_newest()
			: key === 'oldest'
				? m.sort_oldest()
				: m.sort_by({field: fieldLabel(field ?? key)})

	function order(event: Event) {
		const value = (event.currentTarget as HTMLSelectElement).value
		goto(sorted(shownUrl(), value), {replace: true, reset: false})
	}

	const toItems = (list: RepoRecord[]): ReaderItem[] =>
		list.map((record) => ({repo, record, lexicon, href: href(record.rkey)}))

	/** Read (or play) the list from a record on, its next pages as the reader gets there,
	    in its own deck: this type of this repo */
	function read(index = 0) {
		const list = {
			key: `${repo.did}/${collection}`,
			name: `${typeLabel(collection)} · ${repo.local ? (repo.name ?? '') : `@${actorName(repo)}`}`
		}
		let next = cursor
		// Filtered or reordered: what is shown, no further page
		reader.start(
			toItems(shown),
			index,
			async () => {
				if (!next || changed) return []
				const page = await listRecords(repo, collection, next)
				next = page.records.length >= app.reads.pageSize ? page.cursor : undefined
				return toItems(page.records)
			},
			list
		)
	}

	let playable = $derived(shown.some((record) => plays(capabilitiesOf(record.value, lexicon))))

	$effect(() => {
		void collection
		void repo.did
		load()
	})
</script>

<enform-toolbar>
	<p>
		{#if narrowed}
			{(cursor ? m.records_filtered_more : m.records_filtered)({
				shown: String(shown.length),
				count: String(records.length)
			})}
		{:else if records.length}
			{cursor
				? m.records_count_more({count: String(records.length)})
				: records.length === 1
					? m.records_count_one()
					: m.records_count({count: String(records.length)})}
		{/if}
	</p>
	<menu>
		{#if changed}
			<li><a href={cleared(shownUrl())} data-sveltekit-reset="false">{m.filter_clear()}</a></li>
		{/if}
		{#if records.length > 1}
			<li>
				<label>
					<span>{m.filter_sort()}</span>
					<select value={filters.sort} onchange={order}>
						{#each sorts as sort (sort.key)}
							<option value={sort.key}>{sortLabel(sort.key, sort.field)}</option>
						{/each}
					</select>
				</label>
			</li>
		{/if}
		{#if shown.length}
			<li>
				<button type="button" onclick={() => read()}>
					{playable ? m.reader_play_all() : m.reader_read_all()}
				</button>
			</li>
		{/if}
		{@render actions?.()}
	</menu>
</enform-toolbar>
<RecordFilters {facets} active={filters.is} />
<enform-record-grid>
	{#each shown as record, index (record.rkey)}
		<AppRecordCard
			play={() => read(index)}
			{repo}
			{record}
			{lexicon}
			href={href(record.rkey)}
			current={open === record.rkey}
		/>
	{:else}
		{#if !loading && records.length}
			<p>
				{m.records_filtered_none()}
				<a href={cleared(shownUrl())} data-sveltekit-reset="false">{m.filter_clear()}</a>
				{#if filters.q}
					· <a href={searchResultsPath(filters.q)}>{m.search_everywhere_for({query: filters.q})}</a>
				{/if}
			</p>
		{:else if !loading}<p>{m.collection_records_empty()}</p>{/if}
	{/each}
</enform-record-grid>
{#if loading}<p><small>{m.collection_loading()}</small></p>{/if}
{#if cursor && !loading}
	<button type="button" onclick={() => load(true)}>{m.collection_load_more()}</button>
{/if}
