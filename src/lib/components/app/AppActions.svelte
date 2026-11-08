<script lang="ts">
	// What one can do in an app, from its types' lexicons alone: one card per type, a
	// verb for its kind (write, share a link, follow…), its name and its own description;
	// the most useful first, the rest folded
	import * as m from '#lib/paraglide/messages.js'
	import {typeLabel} from '#lib/apps/directory'
	import type {AppType} from '#lib/apps/types'
	import {kindOf} from '#lib/records/kinds'
	import {kindVerb} from '#lib/records/kind-words'
	import Icon from '../shell/Icon.svelte'

	type Props = {types: AppType[]; href?: (type: string) => string; title: string; limit?: number}
	let {types, href, title, limit = 4}: Props = $props()

	/** Types of a known kind first: those without one are the app's plumbing, mostly */
	let sorted = $derived(
		[...types].sort(
			(a, b) =>
				Number(kindOf(a.lexicon).kind === 'thing') - Number(kindOf(b.lexicon).kind === 'thing')
		)
	)
</script>

{#snippet cards(list: AppType[])}
	<enform-actions>
		{#each list as type (type.nsid)}
			{@const kind = kindOf(type.lexicon).kind}
			{@const label = typeLabel(type.nsid)}
			{@const words = kindVerb(kind, label)}
			{@const description = type.lexicon?.defs.main?.description ?? type.lexicon?.description}
			<enform-action {kind}>
				<svelte:element this={href ? 'a' : 'div'} href={href?.(type.nsid)}>
					<Icon name={kind} />
					<strong>{words.verb}</strong>
					{#if !words.named}<span>{label}</span>{/if}
					{#if description}<small>{description}</small>{/if}
				</svelte:element>
			</enform-action>
		{/each}
	</enform-actions>
{/snippet}

{#if types.length}
	<section aria-label={title}>
		<h2>{title}</h2>
		{@render cards(sorted.slice(0, limit))}
		{#if sorted.length > limit}
			<details>
				<summary>{m.actions_all({count: String(sorted.length)})}</summary>
				{@render cards(sorted.slice(limit))}
			</details>
		{/if}
	</section>
{/if}
