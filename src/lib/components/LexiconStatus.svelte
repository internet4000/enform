<script lang="ts">
	// Whether a collection's lexicon resolved, and what it says about itself
	import * as m from '#lib/paraglide/messages.js'
	import type {LexiconDoc} from '#lib/lexicons/types'

	let {nsid, lexicon}: {nsid: string; lexicon: Promise<LexiconDoc | undefined>} = $props()
</script>

<enform-lexicon>
	{#await lexicon}
		<p>{m.lexicon_resolving()}</p>
	{:then doc}
		{#if doc}
			{@const description = doc.description ?? doc.defs.main?.description}
			{#if description}<p>{description}</p>{/if}
		{:else}
			<p>{m.lexicon_missing({nsid})}</p>
		{/if}
	{/await}
</enform-lexicon>
