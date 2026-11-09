<script lang="ts">
	// One type of what a profile has in an app (a radio's tracks, someone's posts): its name
	// and how many, read or play them all, add one when it's yours, and its first records.
	// What a profile has is what its repo has in the same app: no link is written for it
	import * as m from '#lib/paraglide/messages.js'
	import app from '#lib/config/app.json' with {type: 'json'}
	import type {Identity} from '#lib/atproto/identity'
	import {listRecords, type RepoRecord} from '#lib/atproto/repo'
	import {typeLabel} from '#lib/apps/directory'
	import type {AppType} from '#lib/apps/types'
	import {capabilitiesOf, plays} from '#lib/capabilities/detect'
	import {actorName} from '#lib/paths'
	import {reader, type ReaderItem} from '#lib/reader/reader.svelte'
	import AppRecordCard from './AppRecordCard.svelte'

	type Props = {
		repo: Identity
		type: AppType
		/** Its tab, all of them */
		all: string
		href: (rkey: string) => string
		/** Where to add one, when it's yours */
		add?: string
	}
	let {repo, type, all, href, add}: Props = $props()

	/** Records shown here, before "all of them" */
	const SHOWN = 3

	let records = $state<RepoRecord[]>([])
	let cursor = $state<string>()
	let loading = $state(true)

	$effect(() => {
		const collection = type.nsid
		loading = true
		listRecords(repo, collection)
			.then((page) => {
				records = page.records
				cursor = page.records.length >= app.reads.pageSize ? page.cursor : undefined
			})
			.catch(() => (records = []))
			.finally(() => (loading = false))
	})

	let lexicon = $derived(type.lexicon)
	let playable = $derived(records.some((record) => plays(capabilitiesOf(record.value, lexicon))))

	const toItems = (list: RepoRecord[]): ReaderItem[] =>
		list.map((record) => ({repo, record, lexicon, href: href(record.rkey)}))

	/** In the same deck as its tab's list */
	function read(index = 0) {
		let next = cursor
		reader.start(
			toItems(records),
			index,
			async () => {
				if (!next) return []
				const page = await listRecords(repo, type.nsid, next)
				next = page.records.length >= app.reads.pageSize ? page.cursor : undefined
				return toItems(page.records)
			},
			{
				key: `${repo.did}/${type.nsid}`,
				name: `${typeLabel(type.nsid)} · @${actorName(repo)}`
			}
		)
	}
</script>

<enform-type-shelf>
	<header>
		<h2><a href={all}>{typeLabel(type.nsid)}</a></h2>
		{#if !loading}
			<small
				>{cursor
					? m.shelf_count_more({count: String(records.length)})
					: records.length === 1
						? m.records_count_one()
						: m.records_count({count: String(records.length)})}</small
			>
		{/if}
		<menu>
			{#if records.length}
				<li>
					<button type="button" onclick={() => read()}>
						{playable ? m.reader_play_all() : m.reader_read_all()}
					</button>
				</li>
			{/if}
			{#if add}
				<li><a href={add} role="button">+ {m.app_new({type: typeLabel(type.nsid)})}</a></li>
			{/if}
		</menu>
	</header>
	{#if records.length}
		<enform-record-grid>
			{#each records.slice(0, SHOWN) as record, index (record.rkey)}
				<AppRecordCard
					play={() => read(index)}
					{repo}
					{record}
					{lexicon}
					href={href(record.rkey)}
				/>
			{/each}
		</enform-record-grid>
		{#if records.length > SHOWN}
			<p><a href={all}>{m.shelf_all()} →</a></p>
		{/if}
	{:else if loading}
		<p><small>{m.collection_loading()}</small></p>
	{/if}
</enform-type-shelf>
