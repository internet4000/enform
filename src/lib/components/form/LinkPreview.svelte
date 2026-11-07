<script lang="ts">
	// What a web link in a form points to: its image, title and site, once typing stops
	import * as m from '#lib/paraglide/messages.js'
	import {linkDetails, type LinkDetails} from '#lib/links/details'

	let {url}: {url: string} = $props()

	let details = $state<Promise<LinkDetails | undefined>>()

	$effect(() => {
		const current = url
		const timer = setTimeout(() => (details = linkDetails(current)), 400)
		return () => clearTimeout(timer)
	})
</script>

{#if details}
	{#await details}
		<enform-link-preview loading><small>{m.link_preview_loading()}</small></enform-link-preview>
	{:then found}
		{#if found?.title || found?.image}
			<enform-link-preview media={found.media || undefined}>
				{#if found.image}<img src={found.image} alt="" loading="lazy" />{/if}
				<span>
					{#if found.title}<strong>{found.title}</strong>{/if}
					<small>{found.site}</small>
				</span>
			</enform-link-preview>
		{/if}
	{/await}
{/if}
