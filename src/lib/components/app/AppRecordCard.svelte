<script lang="ts">
	// A record as a card in its app: its picture, title, text and date
	import * as m from '#lib/paraglide/messages.js'
	import type {Identity} from '#lib/atproto/identity'
	import {blobUrl, type RepoRecord} from '#lib/atproto/repo'
	import type {LexiconDoc} from '#lib/lexicons/types'
	import {formatDate} from '#lib/dates'
	import {recordCard} from '#lib/records/card'
	import {firstImage} from '#lib/records/links'
	import {recordDate, recordSummary} from '#lib/records/summary'
	import RowSummary from '../RowSummary.svelte'

	type Props = {
		repo: Identity
		record: RepoRecord
		lexicon?: LexiconDoc
		href: string
		current?: boolean
	}
	let {repo, record, lexicon, href, current = false}: Props = $props()

	let node = $derived(lexicon?.defs.main?.record)
	let card = $derived(recordCard(record.value, node))
	let image = $derived(card.banner ?? card.avatar ?? firstImage(record.value))
	let date = $derived(recordDate(record.value))
	let summary = $derived(recordSummary(record.value, node) ?? record.rkey)
</script>

<enform-record-card-item image={image ? true : undefined} current={current || undefined}>
	<a {href} aria-current={current ? 'true' : undefined}>
		{#if image && !repo.local}<img src={blobUrl(repo, image)} alt="" loading="lazy" />{/if}
		<RowSummary text={summary} />
		{#if card.text && card.text !== summary}<span>{card.text}</span>{/if}
		<small>
			{#if date}<time datetime={date}>{formatDate(date)}</time>{/if}
			{#if record.pending}· {record.pending === 'conflict'
					? m.outbox_conflict_short()
					: m.outbox_waiting()}{/if}
		</small>
	</a>
</enform-record-card-item>
