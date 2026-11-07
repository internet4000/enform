<script lang="ts">
	// A blob: a file checked against the lexicon's accept and maxSize, uploaded with
	// the form's uploadBlob, its ref kept as the value. Images are previewed.
	import {onDestroy} from 'svelte'
	import * as m from '#lib/paraglide/messages.js'
	import {blobInfo, fileProblem} from '#lib/forms/blob'
	import {formatBytes} from '#lib/forms/messages'
	import FieldShell from './FieldShell.svelte'
	import {getForm, type FieldProps} from './context.svelte'

	let {node, value = $bindable(), base, name, path, required, item}: FieldProps = $props()

	const form = getForm()
	let problem = $state<string>()
	let uploading = $state(false)
	let preview = $state<string>()
	let input = $state<HTMLInputElement>()

	let info = $derived(blobInfo(value))
	let accept = $derived(node.accept?.join(', '))
	let limits = $derived(
		node.maxSize === undefined
			? accept
			: m.form_blob_accept({accept: accept ?? m.form_blob_any(), max: formatBytes(node.maxSize)})
	)

	function show(file?: File) {
		if (preview) URL.revokeObjectURL(preview)
		preview = file?.type.startsWith('image/') ? URL.createObjectURL(file) : undefined
	}

	onDestroy(() => {
		if (preview) URL.revokeObjectURL(preview)
	})

	async function choose(file: File | undefined) {
		problem = undefined
		if (!file || !form.uploadBlob) return
		const refused = fileProblem(node, file)
		if (refused) {
			problem =
				refused.code === 'type'
					? m.form_blob_wrong_type()
					: m.form_blob_too_big({size: formatBytes(refused.size), max: formatBytes(refused.max)})
			if (input) input.value = ''
			return
		}
		show(file)
		uploading = true
		try {
			value = await form.uploadBlob(file)
		} catch (err) {
			problem = m.form_blob_failed({message: (err as Error).message})
			show()
		} finally {
			uploading = false
		}
	}

	function remove() {
		value = undefined
		problem = undefined
		show()
		if (input) input.value = ''
	}
</script>

<FieldShell
	{node}
	{value}
	{base}
	label={name}
	{path}
	{required}
	{item}
	problems={problem ? [problem] : []}
	busy={uploading}
>
	{#snippet children({id, describedby, invalid})}
		<enform-blob uploading={uploading || undefined} disabled={!form.uploadBlob || undefined}>
			{#if preview}<img src={preview} alt="" />{/if}
			{#if info}
				<p>
					{m.form_blob_current({
						mimeType: info.mimeType,
						size: info.size === undefined ? '?' : formatBytes(info.size)
					})}
					<button type="button" onclick={remove}>{m.form_blob_remove()}</button>
				</p>
			{/if}
			<input
				bind:this={input}
				{id}
				type="file"
				accept={accept?.replaceAll(' ', '')}
				aria-describedby={describedby}
				aria-invalid={invalid}
				aria-busy={uploading}
				disabled={!form.uploadBlob || uploading}
				onchange={(event) => choose(event.currentTarget.files?.[0])}
			/>
		</enform-blob>
	{/snippet}
	{#snippet footer()}
		{#if !form.uploadBlob}
			<small>{m.form_blob_unavailable()}</small>
		{:else if uploading}
			<small aria-live="polite">{m.form_blob_uploading()}</small>
		{:else if limits}
			<small>{limits}</small>
		{/if}
	{/snippet}
</FieldShell>
