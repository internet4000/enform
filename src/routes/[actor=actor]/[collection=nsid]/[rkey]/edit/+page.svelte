<script lang="ts">
	// Edit one of your records with the form its lexicon makes
	import {goto} from '$app/navigation'
	import * as m from '#lib/paraglide/messages.js'
	import {auth} from '#lib/auth/session.svelte'
	import {uploadBlob} from '#lib/atproto/write'
	import Breadcrumbs from '#lib/components/Breadcrumbs.svelte'
	import PermissionNotice from '#lib/components/PermissionNotice.svelte'
	import RecordForm from '#lib/components/form/RecordForm.svelte'
	import {updateFromForm} from '#lib/records/save'
	import {actorName, recordPath} from '#lib/paths'

	let {data} = $props()

	let actor = $derived(actorName(data.repo))
	let owner = $derived(auth.session?.did === data.repo.did)

	async function save(value: Record<string, unknown>) {
		await updateFromForm(data.lexicon, data.rkey, value, data.record.cid)
		await goto(recordPath(actor, data.collection, data.rkey), {invalidateAll: true})
	}
</script>

<Breadcrumbs {actor} collection={data.collection} rkey={data.rkey} />
<h1>{m.edit_title()}</h1>

{#if owner}
	<PermissionNotice collection={data.collection} action="update" />
	{#key data.record.cid}
		<RecordForm
			lexicon={data.lexicon}
			value={data.record.value}
			{uploadBlob}
			onsubmit={save}
			submitLabel={m.edit_submit()}
			autofocus={false}
		/>
	{/key}
{:else if auth.ready}
	<p>{m.edit_not_owner()}</p>
{/if}
