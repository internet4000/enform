<script lang="ts">
	// An app's records of one type, as cards, a page at a time, newest first; over them, a
	// toolbar: how many are shown, in which order, read or play them all, and what the page
	// adds (+ New); then the filters its lexicon offers. The search field and the filters
	// narrow the records loaded so far, from the URL (?q=, ?f.<field>=, ?sort=).
	// In your own repo, Select: as in a mailbox, cards get checkboxes (shift: a range), a
	// bar says how many are selected, offers all that match on every page, and what to
	// do with them: edit a field, save them as JSON, delete them.
	import type {Snippet} from 'svelte'
	import {goto} from '$app/navigation'
	import {page} from '$app/state'
	import * as m from '#lib/paraglide/messages.js'
	import {shownUrl} from '#lib/where.svelte'
	import app from '#lib/config/app.json' with {type: 'json'}
	import type {Identity} from '#lib/atproto/identity'
	import {listRecords, type RepoRecord} from '#lib/atproto/repo'
	import {gatherRecords} from '#lib/atproto/bulk'
	import {saveRecords} from '#lib/records/download'
	import {SvelteSet} from 'svelte/reactivity'
	import BulkActions from './BulkActions.svelte'
	import type {LexiconDoc} from '#lib/lexicons/types'
	import {capabilitiesOf, plays} from '#lib/capabilities/detect'
	import {reader, type ReaderItem} from '#lib/reader/reader.svelte'
	import {fieldLabel} from '#lib/forms/labels'
	import {applyFilters, cleared, facetsOf, readFilters, sorted, sortsOf} from '#lib/records/filters'
	import {typeLabel} from '#lib/apps/directory'
	import {actorName, inApp, searchResultsPath} from '#lib/paths'
	import AppRecordCard from './AppRecordCard.svelte'
	import RecordFilters from './RecordFilters.svelte'

	type Props = {
		repo: Identity
		collection: string
		lexicon?: LexiconDoc
		href: (rkey: string) => string
		open?: string
		/** What the page puts first in the toolbar (its sections) */
		lead?: Snippet
		/** The page's own actions, at the toolbar's end */
		actions?: Snippet
		/** Its records can be selected, to act on many: your own */
		selectable?: boolean
	}
	let {repo, collection, lexicon, href, open, lead, actions, selectable = false}: Props = $props()

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
		goto(inApp(sorted(shownUrl(), value)), {replace: true, reset: false})
	}

	const toItems = (list: RepoRecord[]): ReaderItem[] =>
		list.map((record) => ({repo, record, lexicon, href: href(record.rkey)}))

	/** Read (or play) the list from a record on, its next pages as the reader gets there,
	    in its own deck: this type of this repo */
	function read(index = 0) {
		const list = {
			key: `${repo.did}/${collection}`,
			name: `${typeLabel(collection)} · @${actorName(repo)}`
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

	/** Selecting: the keys selected among those shown, or every record that matches */
	let selecting = $state(false)
	const chosen = new SvelteSet<string>()
	let everything = $state.raw<RepoRecord[]>()
	let reading = $state<number>()
	let last = $state<number>()
	let bulk = $state<BulkActions>()

	/** Not sent yet: not selectable, as their writes still wait in order */
	let selectableShown = $derived(shown.filter((record) => !record.pending))
	let selection = $derived(
		everything ?? selectableShown.filter((record) => chosen.has(record.rkey))
	)
	let allShown = $derived(
		selectableShown.length > 0 && selectableShown.every((record) => chosen.has(record.rkey))
	)

	function stopSelecting() {
		selecting = false
		chosen.clear()
		everything = undefined
		reading = undefined
		last = undefined
	}

	/** A card's click: it alone, or with shift the range from the last one clicked */
	function toggle(index: number, event: MouseEvent) {
		everything = undefined
		const record = shown[index]
		const on = !chosen.has(record.rkey)
		const from = event.shiftKey && last !== undefined ? Math.min(last, index) : index
		const to = event.shiftKey && last !== undefined ? Math.max(last, index) : index
		for (const each of shown.slice(from, to + 1)) {
			if (each.pending) continue
			if (on) chosen.add(each.rkey)
			else chosen.delete(each.rkey)
		}
		last = index
	}

	function toggleShown() {
		everything = undefined
		if (allShown) chosen.clear()
		else for (const record of selectableShown) chosen.add(record.rkey)
	}

	/** Every record that matches the search and filters, reading every page */
	async function selectEverything() {
		reading = 0
		try {
			const all = await gatherRecords(repo, [collection], (count) => (reading = count))
			everything = applyFilters(node, all, filters)
			for (const record of selectableShown) chosen.add(record.rkey)
		} finally {
			reading = undefined
		}
	}

	function rewritten() {
		stopSelecting()
		load()
	}

	let playable = $derived(shown.some((record) => plays(capabilitiesOf(record.value, lexicon))))

	$effect(() => {
		void collection
		void repo.did
		load()
	})
</script>

<!-- Selecting: its sections stay, the bar of what is selected takes the rest's place -->
<enform-toolbar>
	{@render lead?.()}
	{#if !selecting}
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
				<li>
					<a href={inApp(cleared(shownUrl()))} data-sveltekit-reset="false">{m.filter_clear()}</a>
				</li>
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
			{#if selectable && shown.length}
				<li>
					<button type="button" onclick={() => (selecting = true)}>{m.select_start()}</button>
				</li>
			{/if}
			{@render actions?.()}
		</menu>
	{/if}
</enform-toolbar>
{#if selecting}
	<enform-selection-bar>
		<label>
			<input
				type="checkbox"
				checked={allShown || !!everything}
				indeterminate={!allShown && !everything && chosen.size > 0}
				onchange={toggleShown}
				aria-label={m.select_shown()}
			/>
			<span aria-live="polite">
				{everything
					? m.select_all_chosen({count: String(everything.length)})
					: m.select_count({count: String(selection.length)})}
			</span>
		</label>
		{#if reading !== undefined}
			<small role="status">{m.select_all_reading({count: String(reading)})}</small>
		{:else if allShown && !everything && (cursor || narrowed)}
			<button type="button" onclick={selectEverything}>{m.select_all_matching()}</button>
		{/if}
		<menu>
			{#if selection.length}
				{#if lexicon}
					<li>
						<button type="button" onclick={() => bulk?.edit(selection)}>{m.select_edit()}</button>
					</li>
				{/if}
				<li>
					<button
						type="button"
						onclick={() => saveRecords(selection, `${actorName(repo)}-${collection}`)}
						>{m.select_save()}</button
					>
				</li>
				<li>
					<button type="button" data-danger onclick={() => bulk?.remove(selection)}
						>{m.select_delete()}</button
					>
				</li>
			{/if}
			<li><button type="button" onclick={stopSelecting}>{m.select_done()}</button></li>
		</menu>
	</enform-selection-bar>
{/if}
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
			select={selecting && !record.pending
				? {
						checked: !!everything || chosen.has(record.rkey),
						toggle: (event) => toggle(index, event)
					}
				: undefined}
		/>
	{:else}
		{#if !loading && records.length}
			<p>
				{m.records_filtered_none()}
				<a href={inApp(cleared(shownUrl()))} data-sveltekit-reset="false">{m.filter_clear()}</a>
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
<!-- Always there: a permission asked for midway changes the session, not what it does -->
<BulkActions bind:this={bulk} {repo} {collection} {lexicon} changed={rewritten} />
