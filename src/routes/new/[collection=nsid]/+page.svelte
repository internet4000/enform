<script lang="ts">
	// Creating a record happens in your own repo, beside its collection: go there. With
	// nobody yet, the two ways to start, then the form
	import {goto} from '$app/navigation'
	import * as m from '#lib/paraglide/messages.js'
	import {auth} from '#lib/auth/session.svelte'
	import {typeLabel} from '#lib/apps/directory'
	import StartChoice from '#lib/components/StartChoice.svelte'
	import {startOnDevice} from '#lib/local/start'
	import {actorName, appScreenPath} from '#lib/paths'
	import {appOf} from '#lib/apps/names'
	import {kindOf} from '#lib/records/kinds'
	import {kindVerb} from '#lib/records/kind-words'

	let {data} = $props()
	/** As the app's screen says it: "Write something", "Add to Tracks" */
	let title = $derived(kindVerb(kindOf(data.lexicon).kind, typeLabel(data.lexicon.id)).verb)

	$effect(() => {
		if (auth.me) {
			goto(
				appScreenPath(actorName(auth.me), appOf(data.lexicon.id), {
					type: data.lexicon.id,
					create: true
				}),
				{
					replace: true
				}
			)
		}
	})
</script>

<enform-page>
	<h1>{title}</h1>
	{#if auth.ready && !auth.me}
		<p>{m.new_start({type: typeLabel(data.lexicon.id).toLocaleLowerCase()})}</p>
		<StartChoice inline start={() => startOnDevice(m.local_default_name()).then(() => {})} />
	{/if}
</enform-page>
