<script lang="ts">
	// Edit one of your records with the form its lexicon makes
	import {goto} from '$app/navigation'
	import * as m from '#lib/paraglide/messages.js'
	import {auth} from '#lib/auth/session.svelte'
	import type {RepoRecord} from '#lib/atproto/repo'
	import {uploadBlob} from '#lib/atproto/write'
	import type {LexiconDoc} from '#lib/lexicons/types'
	import {updateFromForm} from '#lib/records/save'
	import {recordPath} from '#lib/paths'
	import PermissionLock from './PermissionLock.svelte'
	import RecordForm from './form/RecordForm.svelte'

	type Props = {lexicon: LexiconDoc; actor: string; rkey: string; record: RepoRecord}
	let {lexicon, actor, rkey, record}: Props = $props()

	async function save(value: Record<string, unknown>) {
		await updateFromForm(lexicon, rkey, value, record.cid)
		await goto(recordPath(actor, lexicon.id, rkey), {refreshAll: true})
	}
</script>

{#key record.cid}
	<RecordForm
		{lexicon}
		value={record.value}
		uploadBlob={auth.local ? undefined : uploadBlob}
		onsubmit={save}
		submitLabel={m.edit_submit()}
		autofocus={false}
	>
		{#snippet submitHint()}<PermissionLock collection={lexicon.id} action="update" />{/snippet}
	</RecordForm>
{/key}
