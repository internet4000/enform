<script lang="ts">
	// What a record is, shown for its kind (from its lexicon), before its fields: a link's
	// preview to open, a photo, a status, the person followed, the thing reacted to,
	// an event's date, a post's text, someone's picture and name
	import {describeRecord, recordRest} from '#lib/describe/record'
	import {fieldLabel} from '#lib/forms/labels'
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

	type Props = {
		repo: Identity
		record: RepoRecord
		lexicon?: LexiconDoc
		/** Its media or images are shown already (by a presenter): only the rest */
		beside?: boolean
	}
	let {repo, record, lexicon, beside = false}: Props = $props()

	let shape = $derived(kindOf(lexicon))
	let value = $derived(record.value)
	let field = (key?: string) => (key ? value[key] : undefined)
	let text = $derived(field(shape.fields.text))
	let url = $derived(field(shape.fields.url))
	let subject = $derived(field(shape.fields.subject))
	let card = $derived(recordCard(value, lexicon?.defs.main?.record))
	let image = $derived(card.banner ?? firstImage(field(shape.fields.image) ?? value))

	/** Whether its kind shows it: else (no lexicon, or a kind with nothing to show), it is
	    shown from its values alone, as its card is */
	let known = $derived(
		(shape.kind === 'profile' && !!card.title) ||
			(shape.kind === 'link' && isWebLink(url)) ||
			(shape.kind === 'photo' && !!image && !repo.local) ||
			(shape.kind === 'status' && !!shape.fields.value) ||
			((shape.kind === 'follow' || shape.kind === 'block') && typeof subject === 'string') ||
			(shape.kind === 'reaction' && typeof subject === 'object' && !!subject) ||
			(shape.kind === 'event' && !!shape.fields.start) ||
			(typeof text === 'string' && !!text)
	)
	/** From its values: its first web link (a track's video), its title, its words */
	let link = $derived(Object.values(value).find(isWebLink))
	let title = $derived(describeRecord(record, lexicon).title)
	/** What its kind doesn't show: its other fields, by their shape */
	let rest = $derived(
		recordRest(value, lexicon).filter((part) => part.as !== 'link' || part.value !== link || known)
	)
	let facts = $derived(rest.filter((part) => part.as === 'fact'))
	/** Its title, for every kind (a profile's is its name, shown with its picture) */
	let heading = $derived(
		shape.kind === 'profile' || beside
			? undefined
			: known
				? (() => {
						const named = field(shape.fields.title)
						return typeof named === 'string' && named !== text ? named : undefined
					})()
				: title && title !== link
					? title
					: undefined
	)
	/** When it was made, and changed: its own dates, last */
	let stamps = $derived(
		(
			[
				['createdAt', m.field_created_at],
				['updatedAt', m.field_updated_at]
			] as const
		).flatMap(([key, label]) => {
			const date = value[key]
			return typeof date === 'string' && !Number.isNaN(Date.parse(date))
				? [{date, label: label()}]
				: []
		})
	)
</script>

{#snippet preview(url: string)}
	{#await linkDetails(url) then found}
		<a href={url} rel="noopener noreferrer external" target="_blank">
			{#if found?.image}<img src={found.image} alt="" />{/if}
			<strong>{found?.title ?? url}</strong>
			<small>{m.kind_open_link({site: found?.site ?? new URL(url).hostname})}</small>
		</a>
	{/await}
{/snippet}

<enform-kind-view kind={shape.kind}>
	{#if heading}<h3>{heading}</h3>{/if}
	{#if beside}
		<!-- shown beside its media or images -->
	{:else if shape.kind === 'profile'}
		<!-- Someone, as the app shows them: their picture, their name -->
		<enform-kind-person>
			{#if card.avatar && !repo.local}<img src={blobUrl(repo, card.avatar)} alt="" />{/if}
			{#if card.title}<strong>{card.title}</strong>{/if}
		</enform-kind-person>
	{:else if !known}
		<!-- No kind to show it by: as its card shows it, from its values -->
		{#if card.text && card.text !== title}<p>{card.text}</p>{/if}
		{#if link}{@render preview(link)}{/if}
		{#if !title && !card.text && !link}<small>{m.kind_empty()}</small>{/if}
	{:else if shape.kind === 'link' && isWebLink(url)}
		{@render preview(url)}
	{:else if shape.kind === 'photo' && image && !repo.local}
		<img src={blobUrl(repo, image)} alt={typeof value.alt === 'string' ? value.alt : ''} />
	{:else if shape.kind === 'status' && shape.fields.value}
		<p>{String(value[shape.fields.value] ?? '')}</p>
	{:else if (shape.kind === 'follow' || shape.kind === 'block') && typeof subject === 'string'}
		<IdentityChip actor={subject} />
	{:else if shape.kind === 'reaction' && typeof subject === 'object' && subject && 'uri' in subject}
		<RecordCard uri={String(subject.uri)} />
	{:else if shape.kind === 'event' && shape.fields.start && typeof value[shape.fields.start] === 'string'}
		<time datetime={String(value[shape.fields.start])}
			>{formatDate(String(value[shape.fields.start]))}</time
		>
	{/if}
	{#if typeof text === 'string' && text && shape.kind !== 'status'}<p>{text}</p>{/if}
	{#if facts.length}
		<dl>
			{#each facts as part (part.field)}
				<div>
					<dt>{fieldLabel(part.field)}</dt>
					<dd>{part.as === 'fact' ? part.value : ''}</dd>
				</div>
			{/each}
		</dl>
	{/if}
	{#each rest as part (part.field)}
		{#if part.as !== 'fact'}
			<section>
				<h4>{fieldLabel(part.field)}</h4>
				{#if part.as === 'list'}
					{#if part.ordered}
						<ol>
							{#each part.items as item, index (index)}<li>{item}</li>{/each}
						</ol>
					{:else}
						<ul>
							{#each part.items as item, index (index)}<li>{item}</li>{/each}
						</ul>
					{/if}
				{:else if part.as === 'link'}
					<a href={part.value} rel="noopener noreferrer external" target="_blank">{part.value}</a>
				{:else if part.as === 'date'}
					<time datetime={part.value}>{formatDate(part.value)}</time>
				{:else}
					<p>{part.value}</p>
				{/if}
			</section>
		{/if}
	{/each}
	{#if stamps.length}
		<footer>
			{#each stamps as stamp (stamp.label)}
				<small>{stamp.label} <time datetime={stamp.date}>{formatDate(stamp.date)}</time></small>
			{/each}
		</footer>
	{/if}
</enform-kind-view>
