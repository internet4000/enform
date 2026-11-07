<script lang="ts">
	// Edit and delete, for the signed-in owner of a record
	import {goto} from '$app/navigation'
	import * as m from '#lib/paraglide/messages.js'
	import {deleteRecord} from '#lib/atproto/write'
	import {collectionPath} from '#lib/paths'
	import PermissionNotice from './PermissionNotice.svelte'

	type Props = {actor: string; collection: string; rkey: string; cid: string; editHref: string}
	let {actor, collection, rkey, cid, editHref}: Props = $props()

	let dialog = $state<HTMLDialogElement>()
	let pending = $state(false)
	let failed = $state<string>()

	async function remove(event: SubmitEvent) {
		event.preventDefault()
		pending = true
		failed = undefined
		try {
			await deleteRecord(collection, rkey, cid)
			dialog?.close()
			await goto(collectionPath(actor, collection), {invalidateAll: true})
		} catch (err) {
			failed = (err as Error).message
		} finally {
			pending = false
		}
	}
</script>

<!-- Items of the pane's actions menu -->
<li><a href={editHref} role="button">{m.record_edit()}</a></li>
<li>
	<button type="button" onclick={() => dialog?.showModal()}>{m.record_delete()}</button>
	<dialog bind:this={dialog} aria-labelledby="delete-title">
		<h2 id="delete-title">{m.record_delete_confirm_title()}</h2>
		<p>{m.record_delete_confirm({rkey, collection})}</p>
		<PermissionNotice {collection} action="delete" />
		{#if failed}<p role="alert">{failed}</p>{/if}
		<form onsubmit={remove}>
			<button type="button" onclick={() => dialog?.close()}>{m.action_cancel()}</button>
			<button type="submit" disabled={pending} aria-busy={pending}>{m.record_delete()}</button>
		</form>
	</dialog>
</li>
