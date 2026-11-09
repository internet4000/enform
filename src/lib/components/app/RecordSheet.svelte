<script lang="ts">
	// A record, or a form, open over its app in a native dialog: full screen on phones,
	// centred over the page on wide screens, with a way to its own page (all its details).
	// The page beneath keeps its state; closing (Close, Escape or the backdrop) goes back
	// to it, at its URL.
	import type {Snippet} from 'svelte'
	import {goto} from '$app/navigation'
	import * as m from '#lib/paraglide/messages.js'

	type Props = {
		title: string
		subtitle?: string
		close: string
		/** The record's own page */
		page?: string
		children: Snippet
	}
	let {title, subtitle, close, page, children}: Props = $props()

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
			{#if page}<a href={page}>{m.sheet_open_page()}</a>{/if}
			<form method="dialog">
				<button type="submit" aria-label={m.sheet_close()}>×</button>
			</form>
		</header>
		{@render children()}
	</enform-sheet>
</dialog>
