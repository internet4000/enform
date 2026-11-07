<script lang="ts">
	// Creating a record happens in your own repo, beside its collection: go there
	import {goto} from '$app/navigation'
	import * as m from '#lib/paraglide/messages.js'
	import {auth} from '#lib/auth/session.svelte'
	import {typeLabel} from '#lib/apps/directory'
	import Account from '#lib/components/Account.svelte'
	import {actorName, createPath} from '#lib/paths'

	let {data} = $props()

	$effect(() => {
		if (auth.me) {
			goto(createPath(actorName(auth.me), data.lexicon.id), {replaceState: true})
		}
	})
</script>

<enform-page>
	<h1>{m.new_record_title({collection: typeLabel(data.lexicon.id)})}</h1>
	{#if auth.ready && !auth.me}
		<p>{m.new_sign_in({collection: typeLabel(data.lexicon.id)})}</p>
		<Account />
	{/if}
</enform-page>
