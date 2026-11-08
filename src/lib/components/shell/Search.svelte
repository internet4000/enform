<script lang="ts">
	// The search field, alone at the top of every screen: someone's handle, an app, a
	// lexicon. An at:// URI or a DID opens at once; anything else lists what matches.
	import {goto} from '$app/navigation'
	import {page} from '$app/state'
	import * as m from '#lib/paraglide/messages.js'
	import {searchPath, searchResultsPath} from '#lib/paths'

	let query = $derived(page.url.searchParams.get('q') ?? '')
	let input = $derived(query)

	function submit(event: SubmitEvent) {
		event.preventDefault()
		const value = input.trim()
		if (!value) return
		const direct = /^(at:\/\/|did:)/.test(value) ? searchPath(value) : undefined
		goto(direct ?? searchResultsPath(value))
	}
</script>

<form role="search" onsubmit={submit}>
	<input
		type="search"
		name="q"
		bind:value={input}
		aria-label={m.search_label()}
		placeholder={m.search_placeholder()}
		autocapitalize="off"
		autocomplete="off"
		spellcheck="false"
		enterkeyhint="search"
	/>
</form>
