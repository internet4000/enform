<script lang="ts">
	// A record, or a form, open over its app in a native dialog: full screen on phones,
	// beside the page on wide screens. The page beneath keeps its state; closing (Close,
	// Escape or the backdrop) goes back to it, at its URL.
	import type {Snippet} from 'svelte'
	import {goto} from '$app/navigation'
	import * as m from '#lib/paraglide/messages.js'

	type Props = {title: string; subtitle?: string; close: string; children: Snippet}
	let {title, subtitle, close, children}: Props = $props()

	let dialog: HTMLDialogElement

	$effect(() => {
		if (!dialog.open) dialog.showModal()
	})

	/** A tap on the backdrop (the dialog itself, outside its sheet) closes it */
	function outside(event: MouseEvent) {
		if (event.target === dialog) dialog.close()
	}
</script>

<dialog
	bind:this={dialog}
	aria-labelledby="sheet-title"
	onclose={() => goto(close, {reset: false})}
	onclick={outside}
>
	<enform-sheet>
		<header>
			<hgroup>
				<h2 id="sheet-title">{title}</h2>
				{#if subtitle}<p>{subtitle}</p>{/if}
			</hgroup>
			<form method="dialog">
				<button type="submit" aria-label={m.sheet_close()}>×</button>
			</form>
		</header>
		{@render children()}
	</enform-sheet>
</dialog>
