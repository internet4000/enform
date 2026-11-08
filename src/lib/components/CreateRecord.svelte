<script lang="ts">
	// Create a record in your repo with the form its lexicon makes. A profile (one record
	// per account) that exists already is edited instead.
	import {goto} from '$app/navigation'
	import {page} from '$app/state'
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

	type Props = {
		lexicon: LexiconDoc
		/** Where to go once created (by default: the record, in the data view) */
		created?: (collection: string, rkey: string) => string
		/** Where to edit a profile that exists already (by default: the data view) */
		editing?: (collection: string, rkey: string) => string
	}
	let {lexicon, created, editing}: Props = $props()

	// The keyboard covering a form on arrival is worse than one more tap
	const autofocus = typeof matchMedia !== 'undefined' && matchMedia('(pointer: fine)').matches

	$effect(() => {
		const key = profileKey(lexicon)
		const me = auth.me
		if (!key || !me) return
		getRecord(me, lexicon.id, key).then(
			() =>
				goto(editing?.(lexicon.id, key) ?? editPath(actorName(me), lexicon.id, key), {
					replace: true
				}),
			() => {}
		)
	})

	async function create(value: Record<string, unknown>) {
		const {collection, rkey} = await createFromForm(lexicon, value)
		if (!auth.me) return
		const to = created?.(collection, rkey) ?? recordPath(actorName(auth.me), collection, rkey)
		await goto(to, {refreshAll: true})
	}
</script>

{#if auth.me}
	{#key lexicon.id}
		<RecordForm
			{lexicon}
			value={page.state.prefill ? {...page.state.prefill, $type: lexicon.id} : undefined}
			uploadBlob={auth.local ? undefined : uploadBlob}
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
