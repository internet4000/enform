<script lang="ts">
	// A form for a record of a lexicon, producing a valid record value: empty to create
	// one, or filled with `value` to edit it. Fields not in the lexicon are kept.
	import {onMount, untrack, type Snippet} from 'svelte'
	import * as m from '#lib/paraglide/messages.js'
	import type {LexiconDoc} from '#lib/lexicons/types'
	import {cleanValue} from '#lib/forms/clean'
	import {recordErrors} from '#lib/forms/errors'
	import {initialValue} from '#lib/forms/initial'
	import type {AnyObject, PathErrors} from '#lib/forms/types'
	import ObjectField from './ObjectField.svelte'
	import {FormState, focusField, pathLabel, setForm, type UploadBlob} from './context.svelte'

	type Props = {
		lexicon: LexiconDoc
		/** The record to edit; without it, the form creates a new one */
		value?: Record<string, unknown>
		/** Uploads a file to the repo, returning its blob ref; without it, blobs can't be set */
		uploadBlob?: UploadBlob
		/** Gets the cleaned record value; what it throws is shown */
		onsubmit: (value: Record<string, unknown>) => void | Promise<void>
		submitLabel?: string
		/** Shown in the submit button, e.g. that it asks for permission first */
		submitHint?: Snippet
		/** Focus the first field when the form shows */
		autofocus?: boolean
	}

	let {
		lexicon,
		value,
		uploadBlob,
		onsubmit,
		submitLabel,
		submitHint,
		autofocus = true
	}: Props = $props()

	const uid = $props.id()
	const form = setForm(
		new FormState(
			uid,
			untrack(() => uploadBlob)
		)
	)

	let main = $derived(lexicon.defs.main)
	let base = $derived(lexicon.id)
	let description = $derived(lexicon.description ?? main.description)
	// The form owns its draft once mounted (a new lexicon or record remounts it)
	let draft = $state(
		untrack(() =>
			value ? structuredClone($state.snapshot(value)) : initialValue(lexicon.defs.main, lexicon.id)
		) as AnyObject
	)
	let errors = $state<PathErrors[]>([])
	let checking = $state(true)
	let submitting = $state(false)
	let failure = $state<string>()

	let issues = $derived([
		...errors.map(({path}) => path),
		...[...form.problems.values()].filter(
			(path) => !errors.some((error) => error.path.join() === path.join())
		)
	])
	let invalid = $derived(issues.length > 0)
	let disabled = $derived(submitting || checking || invalid || form.busy.size > 0)

	// Check the whole record (through refs, which may load) whenever it changes
	$effect(() => {
		const snapshot = $state.snapshot(draft)
		let current = true
		checking = true
		recordErrors(main, snapshot, base).then((found) => {
			if (!current) return
			errors = found
			checking = false
		})
		return () => (current = false)
	})

	onMount(() => {
		if (autofocus) focusField(form.id)
	})

	function reveal(path: PathErrors['path']) {
		form.revealed = true
		focusField(form.fieldId(path))
	}

	async function submit(event: SubmitEvent) {
		event.preventDefault()
		if (disabled) return
		submitting = true
		failure = undefined
		try {
			const record = await cleanValue(main, $state.snapshot(draft), base)
			await onsubmit(record as Record<string, unknown>)
		} catch (err) {
			failure = m.form_server_error({message: err instanceof Error ? err.message : String(err)})
		} finally {
			submitting = false
		}
	}
</script>

<enform-form
	invalid={invalid || undefined}
	submitting={submitting || undefined}
	editing={value ? true : undefined}
>
	<form id={form.id} novalidate onsubmit={submit} aria-busy={submitting}>
		{#if description}<p>{description}</p>{/if}
		{#if main.type === 'record' && main.record}
			<ObjectField
				bind:value={draft}
				node={main.record}
				{base}
				name={base}
				path={[]}
				required
				flat
			/>
		{/if}
		<footer>
			<button type="submit" {disabled} aria-describedby="{form.id}-status">
				{@render submitHint?.()}
				{submitting ? m.form_submitting() : (submitLabel ?? m.form_submit())}
			</button>
			<output id="{form.id}-status" for={form.id}>
				{#if failure}
					<p role="alert">{failure}</p>
				{:else if invalid && (form.visited || form.revealed)}
					{m.form_invalid_summary()}
					<ul>
						{#each issues as path (path.join('.'))}
							<li>
								<a
									href="#{form.fieldId(path)}"
									onclick={(event) => {
										event.preventDefault()
										reveal(path)
									}}>{pathLabel(path)}</a
								>
							</li>
						{/each}
					</ul>
				{/if}
			</output>
		</footer>
	</form>
</enform-form>
