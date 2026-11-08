<script lang="ts">
	// A web link's picture (a video's thumbnail, a page's image), once in view
	import {linkDetails, type LinkDetails} from '#lib/links/details'
	import {whenVisible} from '../visible'

	let {url}: {url: string} = $props()
	let details = $state<Promise<LinkDetails | undefined>>()
</script>

<enform-link-thumb {@attach whenVisible(() => (details = linkDetails(url)))}>
	{#await details then found}
		{#if found?.image}<img src={found.image} alt="" loading="lazy" />{/if}
	{/await}
</enform-link-thumb>
