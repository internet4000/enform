<script lang="ts">
	// What a record is, shown for its kind (from its lexicon), before its fields: a link's
	// preview to open, a photo, a status, the person followed, the thing reacted to,
	// an event's date, a post's text
	import * as m from '#lib/paraglide/messages.js'
	import type {Identity} from '#lib/atproto/identity'
	import {blobUrl, type RepoRecord} from '#lib/atproto/repo'
	import type {LexiconDoc} from '#lib/lexicons/types'
	import {formatDate} from '#lib/dates'
	import {isWebLink, linkDetails} from '#lib/links/details'
	import {recordCard} from '#lib/records/card'
	import {kindOf} from '#lib/records/kinds'
	import {firstImage} from '#lib/records/links'
	import IdentityChip from '../IdentityChip.svelte'
	import RecordCard from '../RecordCard.svelte'

	type Props = {repo: Identity; record: RepoRecord; lexicon?: LexiconDoc}
	let {repo, record, lexicon}: Props = $props()

	let shape = $derived(kindOf(lexicon))
	let value = $derived(record.value)
	let field = (key?: string) => (key ? value[key] : undefined)
	let text = $derived(field(shape.fields.text))
	let url = $derived(field(shape.fields.url))
	let subject = $derived(field(shape.fields.subject))
	let image = $derived(
		recordCard(value, lexicon?.defs.main?.record).banner ??
			firstImage(field(shape.fields.image) ?? value)
	)
</script>

<enform-kind-view kind={shape.kind}>
	{#if shape.kind === 'link' && isWebLink(url)}
		{#await linkDetails(url) then found}
			<a href={url} rel="noopener noreferrer external" target="_blank">
				{#if found?.image}<img src={found.image} alt="" />{/if}
				<strong>{found?.title ?? url}</strong>
				<small>{m.kind_open_link({site: found?.site ?? new URL(url).hostname})}</small>
			</a>
		{/await}
	{:else if shape.kind === 'photo' && image && !repo.local}
		<img src={blobUrl(repo, image)} alt={typeof value.alt === 'string' ? value.alt : ''} />
	{:else if shape.kind === 'status' && shape.fields.value}
		<p>{String(value[shape.fields.value] ?? '')}</p>
	{:else if shape.kind === 'follow' && typeof subject === 'string'}
		<IdentityChip actor={subject} />
	{:else if shape.kind === 'reaction' && typeof subject === 'object' && subject && 'uri' in subject}
		<RecordCard uri={String(subject.uri)} />
	{:else if shape.kind === 'event' && shape.fields.start && typeof value[shape.fields.start] === 'string'}
		<time datetime={String(value[shape.fields.start])}
			>{formatDate(String(value[shape.fields.start]))}</time
		>
	{/if}
	{#if typeof text === 'string' && text && shape.kind !== 'status'}<p>{text}</p>{/if}
</enform-kind-view>
