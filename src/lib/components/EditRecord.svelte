<script lang="ts">
	// Edit one of your records with the form its lexicon makes
	import {goto} from '$app/navigation'
	import * as m from '#lib/paraglide/messages.js'
	import type {RepoRecord} from '#lib/atproto/repo'
	import {uploadBlob} from '#lib/atproto/write'
	import type {LexiconDoc} from '#lib/lexicons/types'
	import {updateFromForm} from '#lib/records/save'
	import {recordPath} from '#lib/paths'
	import PermissionNotice from './PermissionNotice.svelte'
	import RecordForm from './form/RecordForm.svelte'

	type Props = {lexicon: LexiconDoc; actor: string; rkey: string; record: RepoRecord}
	let {lexicon, actor, rkey, record}: Props = $props()

	async function save(value: Record<string, unknown>) {
		await updateFromForm(lexicon, rkey, value, record.cid)
		await goto(recordPath(actor, lexicon.id, rkey), {invalidateAll: true})
	}
</script>

<PermissionNotice collection={lexicon.id} action="update" />
{#key record.cid}
	<RecordForm
		{lexicon}
		value={record.value}
		{uploadBlob}
		onsubmit={save}
		submitLabel={m.edit_submit()}
		autofocus={false}
	/>
{/key}
