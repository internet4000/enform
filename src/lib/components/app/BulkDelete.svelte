<script lang="ts">
	// Deleting all of an app's records in your repo: counted first (every page), reviewed
	// (how many of each type, a copy to save, the count typed to confirm), then deleted in
	// batches with their progress, which one can stop between batches.
	import * as m from '#lib/paraglide/messages.js'
	import {invalidateAll} from '$app/navigation'
	import type {Identity} from '#lib/atproto/identity'
	import type {RepoRecord} from '#lib/atproto/repo'
	import {deleteRecords, gatherRecords} from '#lib/atproto/bulk'
	import {typeLabel} from '#lib/apps/directory'
	import {auth} from '#lib/auth/session.svelte'
	import {actorName} from '#lib/paths'

	/** Whose repo, which of its collections, and the app's name and namespace */
	type Props = {repo: Identity; collections: string[]; app: string; namespace: string}
	let {repo, collections, app, namespace}: Props = $props()

	type Step =
		| {step: 'counting'; count: number}
		| {step: 'review'; records: RepoRecord[]}
		| {step: 'deleting'; records: RepoRecord[]; deleted: number}
		| {step: 'done'; records: RepoRecord[]; deleted: number; error?: string; stopped?: boolean}

	let dialog = $state<HTMLDialogElement>()
	let phase = $state<Step>({step: 'counting', count: 0})
	let typed = $state('')
	/** The collections as they were when opened: the screen may change under it */
	let chosen = $state<string[]>([])
	let stopping: AbortController | undefined

	let actor = $derived(`@${actorName(repo)}`)
	let records = $derived(phase.step === 'counting' ? [] : phase.records)
	let count = $derived(phase.step === 'counting' ? phase.count : records.length)
	let perType = $derived(
		chosen
			.map((nsid) => ({
				nsid,
				count: records.filter((record) => record.collection === nsid).length
			}))
			.filter((type) => type.count)
	)
	/** Whether the server will ask for permission first */
	let asks = $derived(!auth.local && perType.some((type) => !auth.canWrite(type.nsid, 'delete')))

	export async function open() {
		typed = ''
		chosen = [...collections]
		phase = {step: 'counting', count: 0}
		dialog?.showModal()
		try {
			const records = await gatherRecords(repo, chosen, (found) => {
				if (phase.step === 'counting') phase = {step: 'counting', count: found}
			})
			phase = {step: 'review', records}
		} catch (err) {
			phase = {step: 'done', records: [], deleted: 0, error: (err as Error).message}
		}
	}

	/** The records as read, to keep: their at:// URIs, CIDs and values */
	function saveCopy(records: RepoRecord[]) {
		const json = JSON.stringify(
			records.map(({uri, cid, value}) => ({uri, cid, value})),
			null,
			2
		)
		const link = document.createElement('a')
		link.href = URL.createObjectURL(new Blob([json], {type: 'application/json'}))
		link.download = `${actorName(repo)}-${namespace}-${new Date().toISOString().slice(0, 10)}.json`
		link.click()
		URL.revokeObjectURL(link.href)
	}

	async function run(event: SubmitEvent) {
		event.preventDefault()
		if (phase.step !== 'review') return
		const records = phase.records
		stopping = new AbortController()
		phase = {step: 'deleting', records, deleted: 0}
		let deleted = 0
		try {
			deleted = await deleteRecords(
				records,
				(done) => {
					deleted = done
					if (phase.step === 'deleting') phase = {...phase, deleted}
				},
				stopping.signal
			)
			phase = {step: 'done', records, deleted, stopped: stopping.signal.aborted}
		} catch (err) {
			phase = {step: 'done', records, deleted, error: (err as Error).message}
		}
	}
</script>

<dialog
	bind:this={dialog}
	aria-labelledby="bulk-delete-title"
	data-danger
	oncancel={(event) => phase.step === 'deleting' && event.preventDefault()}
	onclose={() => phase.step === 'done' && phase.deleted && invalidateAll()}
>
	<h2 id="bulk-delete-title">{m.bulk_delete_title({app})}</h2>
	{#if phase.step === 'counting'}
		<p role="status">{m.bulk_counting({count: String(phase.count)})}</p>
		<p><button type="button" onclick={() => dialog?.close()}>{m.action_cancel()}</button></p>
	{:else if phase.step === 'review' && !count}
		<p>{m.bulk_none({app})}</p>
		<p><button type="button" onclick={() => dialog?.close()}>{m.sheet_close()}</button></p>
	{:else if phase.step === 'review'}
		<p>{m.bulk_review({count: String(count), app, actor})}</p>
		<ul>
			{#each perType as type (type.nsid)}
				<li>{typeLabel(type.nsid)} · {type.count} <small>{type.nsid}</small></li>
			{/each}
		</ul>
		<p>{m.bulk_irreversible()}</p>
		<p>
			<button type="button" onclick={() => saveCopy(records)}>{m.bulk_save_copy()}</button>
		</p>
		{#if asks}<p><small>{m.bulk_permission()}</small></p>{/if}
		<form onsubmit={run}>
			<label>
				{m.bulk_confirm({count: String(count)})}
				<input bind:value={typed} inputmode="numeric" autocomplete="off" required />
			</label>
			<p>
				<button type="button" onclick={() => dialog?.close()}>{m.action_cancel()}</button>
				<button type="submit" disabled={typed.trim() !== String(count)}>
					{m.bulk_delete_button({count: String(count)})}
				</button>
			</p>
		</form>
	{:else if phase.step === 'deleting'}
		<p role="status">
			{m.bulk_deleting({deleted: String(phase.deleted), count: String(count)})}
		</p>
		<progress max={count} value={phase.deleted}></progress>
		<p><button type="button" onclick={() => stopping?.abort()}>{m.bulk_stop()}</button></p>
	{:else}
		<p role="status">
			{#if phase.error}
				{m.bulk_failed({deleted: String(phase.deleted), error: phase.error})}
			{:else if phase.stopped}
				{m.bulk_stopped({deleted: String(phase.deleted), count: String(count)})}
			{:else}
				{m.bulk_done({deleted: String(phase.deleted)})}
			{/if}
		</p>
		<p><button type="button" onclick={() => dialog?.close()}>{m.sheet_close()}</button></p>
	{/if}
</dialog>
