<script lang="ts">
	// A record, or a form, open over its app: a full screen on phones, a side panel on
	// wide screens; closing it goes back to the app
	import type {Snippet} from 'svelte'
	import * as m from '#lib/paraglide/messages.js'

	let {title, close, children}: {title: string; close: string; children: Snippet} = $props()
</script>

<enform-sheet role="complementary" aria-labelledby="sheet-title">
	<header>
		<h2 id="sheet-title">{title}</h2>
		<a href={close} aria-label={m.sheet_close()}>×</a>
	</header>
	{@render children()}
</enform-sheet>
