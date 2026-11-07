<script lang="ts">
	// Create a record in your repo with the form its lexicon makes. A profile (one record
	// per account) that exists already is edited instead.
	import {goto} from '$app/navigation'
	import {page} from '$app/state'
	import {AtUri} from '@atproto/syntax'
	import * as m from '#lib/paraglide/messages.js'
	import {auth} from '#lib/auth/session.svelte'
	import {getRecord} from '#lib/atproto/repo'
	import {uploadBlob} from '#lib/atproto/write'
	import {profileKey} from '#lib/lexicons/kind'
	import type {LexiconDoc} from '#lib/lexicons/types'
	import {createFromForm} from '#lib/records/save'
	import {actorName, editPath, recordPath} from '#lib/paths'
	import Account from './Account.svelte'
	import PermissionLock from './PermissionLock.svelte'
	import RecordForm from './form/RecordForm.svelte'

	let {lexicon}: {lexicon: LexiconDoc} = $props()

	// The keyboard covering a form on arrival is worse than one more tap
	const autofocus = typeof matchMedia !== 'undefined' && matchMedia('(pointer: fine)').matches

	$effect(() => {
		const key = profileKey(lexicon)
		const me = auth.identity
		if (!key || !me) return
		getRecord(me, lexicon.id, key).then(
			() => goto(editPath(actorName(me), lexicon.id, key), {replaceState: true}),
			() => {}
		)
	})

	async function create(value: Record<string, unknown>) {
		const {uri} = await createFromForm(lexicon, value)
		const at = new AtUri(uri)
		const actor = auth.identity ? actorName(auth.identity) : at.host
		await goto(recordPath(actor, at.collection, at.rkey), {invalidateAll: true})
	}
</script>

{#if auth.session}
	{#key lexicon.id}
		<RecordForm
			{lexicon}
			value={page.state.prefill ? {...page.state.prefill, $type: lexicon.id} : undefined}
			{uploadBlob}
			onsubmit={create}
			submitLabel={m.new_submit()}
			{autofocus}
		>
			{#snippet submitHint()}<PermissionLock collection={lexicon.id} action="create" />{/snippet}
		</RecordForm>
	{/key}
{:else if auth.ready}
	<p>{m.new_sign_in({collection: lexicon.id})}</p>
	<Account />
{/if}
