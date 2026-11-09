<script lang="ts">
	// A record as a card in its app, shaped by its kind (from its lexicon): a link with its
	// thumbnail, a photo, a status in big, an event's date, a post's text…
	import * as m from '#lib/paraglide/messages.js'
	import type {Identity} from '#lib/atproto/identity'
	import {blobUrl, type RepoRecord} from '#lib/atproto/repo'
	import type {LexiconDoc} from '#lib/lexicons/types'
	import {formatDate} from '#lib/dates'
	import {isWebLink} from '#lib/links/details'
	import {recordCard} from '#lib/records/card'
	import {kindOf} from '#lib/records/kinds'
	import {firstImage} from '#lib/records/links'
	import {recordDate, recordSummary} from '#lib/records/summary'
	import RowSummary from '../RowSummary.svelte'
	import LinkThumb from './LinkThumb.svelte'
	import RecordActionsMenu from './RecordActionsMenu.svelte'

	type Props = {
		repo: Identity
		record: RepoRecord
		lexicon?: LexiconDoc
		href: string
		current?: boolean
		/** Starts the reader on it, with its list */
		play?: () => void
	}
	let {repo, record, lexicon, href, current = false, play}: Props = $props()

	let node = $derived(lexicon?.defs.main?.record)
	let shape = $derived(kindOf(lexicon))
	let value = $derived(record.value)
	let card = $derived(recordCard(value, node))
	let image = $derived(card.banner ?? card.avatar ?? firstImage(value))
	let url = $derived(shape.fields.url ? value[shape.fields.url] : undefined)
	let start = $derived(shape.fields.start ? String(value[shape.fields.start] ?? '') : '')
	let date = $derived(recordDate(value))
	let summary = $derived(
		(shape.kind === 'status' && shape.fields.value
			? String(value[shape.fields.value] ?? '')
			: recordSummary(value, node)) || record.rkey
	)
</script>

<enform-record-card-item
	kind={shape.kind}
	image={image || isWebLink(url) ? true : undefined}
	current={current || undefined}
>
	<a {href} aria-current={current ? 'true' : undefined}>
		{#if image && !repo.local}
			<img src={blobUrl(repo, image)} alt="" loading="lazy" />
		{:else if isWebLink(url)}
			<LinkThumb {url} />
		{/if}
		{#if shape.kind === 'event' && start}
			<time datetime={start}>{formatDate(start)}</time>
		{/if}
		<RowSummary text={summary} />
		{#if card.text && card.text !== summary}<span>{card.text}</span>{/if}
		<small>
			{#if date && shape.kind !== 'event'}<time datetime={date}>{formatDate(date)}</time>{/if}
			{#if record.pending}
				· {record.pending === 'conflict' ? m.outbox_conflict_short() : m.outbox_waiting()}
			{/if}
		</small>
	</a>
	{#if play}
		<RecordActionsMenu value={record.value} {lexicon} title={summary} start={play} first />
	{/if}
</enform-record-card-item>
