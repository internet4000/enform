<script lang="ts">
	// A record, or a form, open over its app: a full screen on phones, a side panel on
	// wide screens; closing it goes back to the app
	import type {Snippet} from 'svelte'
	import * as m from '#lib/paraglide/messages.js'

	type Props = {title: string; subtitle?: string; close: string; children: Snippet}
	let {title, subtitle, close, children}: Props = $props()
</script>

<enform-sheet role="complementary" aria-labelledby="sheet-title">
	<header>
		<hgroup>
			<h2 id="sheet-title">{title}</h2>
			{#if subtitle}<p>{subtitle}</p>{/if}
		</hgroup>
		<a href={close} aria-label={m.sheet_close()}>×</a>
	</header>
	{@render children()}
</enform-sheet>
