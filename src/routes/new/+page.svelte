<script lang="ts">
	// What to create: one of your collections, one enform knows, or any NSID
	import {goto} from '$app/navigation'
	import {NSID} from '@atproto/syntax'
	import * as m from '#lib/paraglide/messages.js'
	import {auth} from '#lib/auth/session.svelte'
	import {listCollections} from '#lib/atproto/repo'
	import {groupByApp} from '#lib/collections'
	import {newPath} from '#lib/paths'

	let {data} = $props()

	let nsid = $state('')
	let invalid = $state(false)
	let mine = $derived(
		auth.identity ? listCollections(auth.identity).then(groupByApp) : Promise.resolve([])
	)

	function open(event: SubmitEvent) {
		event.preventDefault()
		const value = nsid.trim()
		invalid = !NSID.isValid(value)
		if (!invalid) goto(newPath(value))
	}
</script>

<h1>{m.new_title()}</h1>

<form onsubmit={open} role="search">
	<label>
		{m.new_nsid_label()}
		<input
			type="text"
			bind:value={nsid}
			placeholder="com.example.recipe"
			autocapitalize="off"
			autocomplete="off"
			spellcheck="false"
			enterkeyhint="go"
			aria-invalid={invalid}
			required
		/>
	</label>
	<button type="submit">{m.new_nsid_submit()}</button>
</form>
{#if invalid}<p role="alert">{m.new_nsid_invalid()}</p>{/if}

{#snippet groups(list: {app: string; collections: string[]}[])}
	{#each list as group (group.app)}
		<section>
			<h3>{group.app}</h3>
			<ul>
				{#each group.collections as collection (collection)}
					<li><a href={newPath(collection)}>{collection}</a></li>
				{/each}
			</ul>
		</section>
	{/each}
{/snippet}

<enform-apps>
	{#await mine then list}
		{#if list.length}
			<h2>{m.new_yours()}</h2>
			{@render groups(list)}
		{/if}
	{/await}
	<h2>{m.new_known()}</h2>
	{@render groups(data.known)}
</enform-apps>
