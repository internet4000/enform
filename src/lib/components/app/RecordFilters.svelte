<script lang="ts">
	// The filters a list's lexicon offers, as chips with how many have each: a value it can
	// only be, the site its links go to, having an image or not. Each is a link (the URL
	// keeps them), toggled where you are, without scrolling away.
	import * as m from '#lib/paraglide/messages.js'
	import {shownUrl} from '#lib/where.svelte'
	import {fieldLabel} from '#lib/forms/labels'
	import {HAS, NONE, toggled, type Facet} from '#lib/records/filters'

	let {facets, active}: {facets: Facet[]; active: Record<string, string>} = $props()

	function label(facet: Facet, value: string): string {
		if (value === NONE) return facet.how === 'presence' ? m.filter_without() : m.filter_none()
		if (value === HAS) return m.filter_with()
		if (value === 'true') return m.filter_yes()
		if (value === 'false') return m.filter_no()
		if (facet.how === 'tag') return `#${value}`
		// A known value named by a lexicon (app.bsky.feed.defs#requestLess): its own name
		return value.includes('#') ? value.split('#').pop()! : value
	}
	/** Its values, and the one chosen even when none of those loaded has it */
	const values = (facet: Facet) =>
		active[facet.key] && !facet.values.some(({value}) => value === active[facet.key])
			? [...facet.values, {value: active[facet.key], count: 0}]
			: facet.values
</script>

{#if facets.length}
	<enform-filters
		role="group"
		aria-label={m.filter_title()}
		data-sveltekit-reset="false"
		data-sveltekit-replacestate
	>
		{#each facets as facet (facet.key)}
			<enform-facet>
				<span>{facet.how === 'tag' ? m.field_tags() : fieldLabel(facet.key)}</span>
				<ul>
					{#each values(facet) as { value, count } (value)}
						<li>
							<a
								href={toggled(shownUrl(), facet.key, value)}
								aria-current={active[facet.key] === value ? 'true' : undefined}
							>
								{label(facet, value)} <small>{count}</small>
							</a>
						</li>
					{/each}
				</ul>
			</enform-facet>
		{/each}
	</enform-filters>
{/if}
