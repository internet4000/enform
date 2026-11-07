<script lang="ts">
	// Create a record in your repo, with the form its lexicon makes
	import {goto} from '$app/navigation'
	import {AtUri} from '@atproto/syntax'
	import * as m from '#lib/paraglide/messages.js'
	import {auth} from '#lib/auth/session.svelte'
	import {uploadBlob} from '#lib/atproto/write'
	import Account from '#lib/components/Account.svelte'
	import PermissionNotice from '#lib/components/PermissionNotice.svelte'
	import RecordForm from '#lib/components/form/RecordForm.svelte'
	import {createFromForm} from '#lib/records/save'
	import {lexiconPath, recordPath} from '#lib/paths'

	let {data} = $props()

	let lexicon = $derived(data.lexicon)
	// The keyboard covering a form on arrival is worse than one more tap
	const autofocus = typeof matchMedia !== 'undefined' && matchMedia('(pointer: fine)').matches

	async function create(value: Record<string, unknown>) {
		const {uri} = await createFromForm(lexicon, value)
		const at = new AtUri(uri)
		await goto(recordPath(auth.identity?.handle ?? at.host, at.collection, at.rkey))
	}
</script>

<header>
	<h1>{m.new_record_title({collection: lexicon.id})}</h1>
	<p><small><a href={lexiconPath(lexicon.id)}>{m.lexicon_view()}</a></small></p>
</header>

{#if auth.session}
	<PermissionNotice collection={lexicon.id} action="create" />
	{#key lexicon.id}
		<RecordForm {lexicon} {uploadBlob} onsubmit={create} submitLabel={m.new_submit()} {autofocus} />
	{/key}
{:else if auth.ready}
	<p>{m.new_sign_in({collection: lexicon.id})}</p>
	<Account />
{/if}
