<script lang="ts">
	// What one can do in an app, from its types' lexicons alone: one card per type, a
	// verb for its kind (write, share a link, follow…), its name and its own description;
	// the most useful first, the rest folded. What one has only one of (a profile, a
	// status) and already has is edited, not made again.
	import * as m from '#lib/paraglide/messages.js'
	import {typeLabel} from '#lib/apps/directory'
	import type {AppSingle, AppType} from '#lib/apps/types'
	import {kindOf} from '#lib/records/kinds'
	import {kindVerb} from '#lib/records/kind-words'
	import Icon from '../shell/Icon.svelte'
	import AppIcon from '../pane/AppIcon.svelte'

	type Props = {
		types: AppType[]
		href?: (type: string) => string
		/** Where to edit the one record of a type one has, when it can be edited */
		edit?: (type: string, rkey: string) => string
		title: string
		/** The app's domain, to show its icon before the title */
		domain?: string
		limit?: number
	}
	let {types, href, edit, title, domain, limit = 4}: Props = $props()

	/** The one record of this type one already has, to edit */
	const had = (type: AppType): string | undefined =>
		'rkey' in type && (type as AppSingle).record ? (type as AppSingle).rkey : undefined

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
			{@const rkey = edit && had(type)}
			{@const words = rkey
				? {verb: m.actions_edit({type: label.toLocaleLowerCase()}), named: false}
				: kindVerb(kind, label)}
			{@const description = type.lexicon?.defs.main?.description ?? type.lexicon?.description}
			{@const to = rkey ? edit?.(type.nsid, rkey) : href?.(type.nsid)}
			<enform-action {kind}>
				<svelte:element this={to ? 'a' : 'div'} href={to}>
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
		<h2>
			{#if domain}<AppIcon {domain} name={title} />{/if}
			{title}
		</h2>
		{@render cards(sorted.slice(0, limit))}
		{#if sorted.length > limit}
			<details>
				<summary>{m.actions_all({count: String(sorted.length)})}</summary>
				{@render cards(sorted.slice(limit))}
			</details>
		{/if}
	</section>
{/if}
