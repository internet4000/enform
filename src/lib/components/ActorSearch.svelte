<script lang="ts">
	// Open a repo, collection or record from a handle, a DID or an at:// URI
	import {goto} from '$app/navigation'
	import * as m from '#lib/paraglide/messages.js'
	import {searchPath} from '#lib/paths'

	let {value = ''}: {value?: string} = $props()

	let input = $derived(value)
	let invalid = $state(false)

	function submit(event: SubmitEvent) {
		event.preventDefault()
		const path = searchPath(input)
		invalid = !path
		if (path) goto(path)
	}
</script>

<enform-actor-search>
	<form onsubmit={submit} role="search">
		<label>
			{m.actor_search_label()}
			<input
				type="search"
				name="actor"
				bind:value={input}
				placeholder={m.actor_search_placeholder()}
				autocapitalize="off"
				autocomplete="off"
				spellcheck="false"
				enterkeyhint="go"
				aria-invalid={invalid}
				required
			/>
		</label>
		<button type="submit">{m.actor_search_submit()}</button>
	</form>
	{#if invalid}
		<p role="alert">{m.actor_search_invalid()}</p>
	{/if}
</enform-actor-search>
