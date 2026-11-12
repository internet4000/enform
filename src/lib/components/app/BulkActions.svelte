<script lang="ts">
	// What one does to records selected in a list, as in a mailbox: delete them (a copy to
	// save first, the count typed when there are many), or set one field on all of them,
	// with the field's own control from the lexicon, or take it off them. Each record is
	// checked against its lexicon before anything is written; then batches, with progress.
	import * as m from '#lib/paraglide/messages.js'
	import type {Identity} from '#lib/atproto/identity'
	import type {RepoRecord} from '#lib/atproto/repo'
	import type {LexiconDoc, LexNode} from '#lib/lexicons/types'
	import {writeRecords, type Change} from '#lib/atproto/bulk'
	import {uploadBlob} from '#lib/atproto/write'
	import {auth} from '#lib/auth/session.svelte'
	import {cleanValue} from '#lib/forms/clean'
	import {initialProperty} from '#lib/forms/initial'
	import {fieldLabel} from '#lib/forms/labels'
	import {fieldOrder} from '#lib/forms/order'
	import {lexiconClosure, validateRecord} from '#lib/forms/validate'
	import {actorName} from '#lib/paths'
	import {saveRecords} from '#lib/records/download'
	import Field from '../form/Field.svelte'
	import {FormState, setForm} from '../form/context.svelte'

	type Props = {
		repo: Identity
		collection: string
		lexicon?: LexiconDoc
		/** Once records were written: the list reads them again */
		changed: () => void
	}
	let {repo, collection, lexicon, changed}: Props = $props()

	/** Many records: the count is typed to delete them */
	const MANY = 20

	type Phase =
		| {step: 'delete'}
		| {step: 'edit'}
		| {step: 'writing'; written: number}
		| {step: 'done'; written: number; edited: boolean; error?: string; stopped?: boolean}

	const id = $props.id()
	setForm(new FormState(`${id}-bulk`, auth.local ? undefined : uploadBlob))

	let dialog = $state<HTMLDialogElement>()
	let phase = $state<Phase>({step: 'delete'})
	let records = $state.raw<RepoRecord[]>([])
	let typed = $state('')
	let failure = $state<string>()
	let stopping: AbortController | undefined

	let count = $derived(records.length)
	let node = $derived(lexicon?.defs.main?.record)
	let fields = $derived(
		node ? (({fields, automatic}) => [...fields, ...automatic])(fieldOrder(node)) : []
	)
	let field = $state('')
	let fieldNode = $derived<LexNode | undefined>(node?.properties?.[field])
	let required = $derived(!!node?.required?.includes(field))
	let value = $state<unknown>()
	let asks = $derived(
		!auth.local && !auth.canWrite(collection, phase.step === 'edit' ? 'update' : 'delete')
	)

	function pick(key: string) {
		field = key
		const prop = node?.properties?.[key]
		value = prop
			? initialProperty(key, prop, !!node?.required?.includes(key), collection)
			: undefined
	}

	export function remove(selected: RepoRecord[]) {
		records = selected
		typed = ''
		failure = undefined
		phase = {step: 'delete'}
		dialog?.showModal()
	}

	export function edit(selected: RepoRecord[]) {
		records = selected
		failure = undefined
		pick(fields[0] ?? '')
		phase = {step: 'edit'}
		dialog?.showModal()
	}

	async function write(changes: Change[], edited: boolean) {
		stopping = new AbortController()
		phase = {step: 'writing', written: 0}
		let written = 0
		try {
			written = await writeRecords(
				changes,
				(done) => {
					written = done
					phase = {step: 'writing', written}
				},
				stopping.signal
			)
			phase = {step: 'done', written, edited, stopped: stopping.signal.aborted}
		} catch (err) {
			phase = {step: 'done', written, edited, error: (err as Error).message}
		}
		if (written) changed()
	}

	function confirmDelete(event: SubmitEvent) {
		event.preventDefault()
		void write(
			records.map(({collection, rkey, cid}) => ({collection, rkey, cid})),
			false
		)
	}

	/** Each record with the field set (or taken off), checked against its lexicon first */
	async function confirmEdit(set: boolean) {
		failure = undefined
		const cleaned = set && fieldNode ? await cleanValue(fieldNode, value, collection) : undefined
		const changes: Change[] = records.map(({collection, rkey, cid, value: before}) => {
			const after = {...before}
			if (cleaned === undefined) delete after[field]
			else after[field] = cleaned
			return {collection, rkey, cid, value: after}
		})
		if (lexicon) {
			const lexicons = await lexiconClosure(collection)
			const invalid = changes
				.map((change) => validateRecord(lexicons, collection, change.value))
				.filter((result) => !result.success)
			if (invalid.length) {
				const first = invalid[0]
				failure = m.bulk_edit_invalid({
					count: String(invalid.length),
					error: first.success ? '' : first.error
				})
				return
			}
		}
		void write(changes, true)
	}
</script>

<dialog
	bind:this={dialog}
	aria-labelledby="{id}-title"
	oncancel={(event) => phase.step === 'writing' && event.preventDefault()}
>
	{#if phase.step === 'delete'}
		<h2 id="{id}-title">{m.bulk_delete_title({count: String(count)})}</h2>
		<p>{m.bulk_irreversible()}</p>
		<p>
			<button type="button" onclick={() => saveRecords(records, `${actorName(repo)}-${collection}`)}
				>{m.bulk_save_copy()}</button
			>
		</p>
		{#if asks}<p><small>{m.bulk_permission()}</small></p>{/if}
		<form data-fields onsubmit={confirmDelete}>
			{#if count > MANY}
				<label>
					{m.bulk_confirm({count: String(count)})}
					<input bind:value={typed} inputmode="numeric" autocomplete="off" required />
				</label>
			{/if}
			<p>
				<button type="button" onclick={() => dialog?.close()}>{m.action_cancel()}</button>
				<button type="submit" data-danger disabled={count > MANY && typed.trim() !== String(count)}>
					{m.bulk_delete_button({count: String(count)})}
				</button>
			</p>
		</form>
	{:else if phase.step === 'edit'}
		<h2 id="{id}-title">{m.bulk_edit_title({count: String(count)})}</h2>
		<form
			data-fields
			onsubmit={(event) => {
				event.preventDefault()
				void confirmEdit(true)
			}}
		>
			<label>
				{m.bulk_edit_field()}
				<select value={field} onchange={(event) => pick(event.currentTarget.value)}>
					{#each fields as key (key)}
						<option value={key}>{fieldLabel(key)}</option>
					{/each}
				</select>
			</label>
			{#if fieldNode}
				{#key field}
					<Field
						node={fieldNode}
						bind:value
						base={collection}
						name={field}
						path={[field]}
						{required}
					/>
				{/key}
			{/if}
			{#if asks}<p><small>{m.bulk_permission()}</small></p>{/if}
			{#if failure}<p role="alert">{failure}</p>{/if}
			<p>
				<button type="button" onclick={() => dialog?.close()}>{m.action_cancel()}</button>
				{#if fieldNode && !required}
					<button type="button" onclick={() => confirmEdit(false)}>
						{m.bulk_edit_remove({count: String(count)})}
					</button>
				{/if}
				<button type="submit" disabled={!fieldNode}>
					{m.bulk_edit_set({count: String(count)})}
				</button>
			</p>
		</form>
	{:else if phase.step === 'writing'}
		<h2 id="{id}-title">
			{m.bulk_writing({written: String(phase.written), count: String(count)})}
		</h2>
		<progress max={count} value={phase.written}></progress>
		<p><button type="button" onclick={() => stopping?.abort()}>{m.bulk_stop()}</button></p>
	{:else}
		<h2 id="{id}-title">
			{#if phase.error}
				{m.bulk_failed({written: String(phase.written), error: phase.error})}
			{:else if phase.stopped}
				{m.bulk_stopped({written: String(phase.written), count: String(count)})}
			{:else if phase.edited}
				{m.bulk_edited({count: String(phase.written)})}
			{:else}
				{m.bulk_deleted({count: String(phase.written)})}
			{/if}
		</h2>
		<p><button type="button" onclick={() => dialog?.close()}>{m.sheet_close()}</button></p>
	{/if}
</dialog>
