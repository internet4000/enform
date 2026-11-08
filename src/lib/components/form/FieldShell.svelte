<script lang="ts">
	import {fieldLabel} from '#lib/forms/labels'
	// A field's frame: its label (or legend), hint and errors around the control.
	// Errors show once the field was left, or when the form reveals them all.
	import type {Snippet} from 'svelte'
	import * as m from '#lib/paraglide/messages.js'
	import {fieldErrors} from '#lib/forms/constraints'
	import {errorMessage} from '#lib/forms/messages'
	import type {FieldError} from '#lib/forms/types'
	import type {LexNode} from '#lib/lexicons/types'
	import {getForm, type Control} from './context.svelte'

	type Props = {
		node: LexNode
		value: unknown
		base: string
		label: string
		path: (string | number)[]
		required: boolean
		item?: boolean
		/** A fieldset with a legend, for fields made of several controls */
		group?: boolean
		/** Errors of the field's own making (a file too big, JSON that doesn't parse) */
		problems?: (FieldError | string)[]
		/** Working on something (an upload, a fetch) the form must wait for */
		busy?: boolean
		children: Snippet<[Control]>
		/** Buttons beside the label */
		actions?: Snippet
		/** Under the control, before errors (a counter, a preview) */
		footer?: Snippet
	}

	let {
		node,
		value,
		base,
		label,
		path,
		required,
		item = false,
		group = false,
		problems = [],
		busy = false,
		children,
		actions,
		footer
	}: Props = $props()

	const form = getForm()
	let touched = $state(false)

	let id = $derived(form.fieldId(path))
	let errors = $derived([
		...(touched || form.revealed ? fieldErrors(node, value, {required, base}) : []),
		...problems
	])
	let messages = $derived(errors.map((e) => (typeof e === 'string' ? e : errorMessage(e))))
	let hint = $derived(node.description)
	let invalid = $derived(messages.length ? (true as const) : undefined)
	let describedby = $derived(
		[hint && `${id}-hint`, invalid && `${id}-error`].filter(Boolean).join(' ') || undefined
	)
	// In a group the fieldset has the field's id, its first control another one
	let control = $derived({id: group ? `${id}-input` : id, describedby, invalid})

	// The form can't be submitted while a field has problems of its own, or is busy
	$effect(() => {
		const key = id
		if (problems.length) form.problems.set(key, path)
		else form.problems.delete(key)
		if (busy) form.busy.add(key)
		else form.busy.delete(key)
		return () => {
			form.problems.delete(key)
			form.busy.delete(key)
		}
	})
</script>

{#snippet title()}
	{fieldLabel(label)}
	{#if !required && !item}<small>{m.form_optional()}</small>{/if}
{/snippet}

{#snippet notes()}
	{#if footer}{@render footer()}{/if}
	{#if invalid}
		<p id="{id}-error" role="alert">{messages.join(' · ')}</p>
	{/if}
{/snippet}

<enform-field
	type={node.type}
	format={node.format}
	required={required || undefined}
	{invalid}
	onfocusout={() => (touched = form.visited = true)}
>
	{#if group}
		<fieldset {id} aria-describedby={describedby}>
			<legend>{@render title()}</legend>
			{#if actions}<menu>{@render actions()}</menu>{/if}
			{#if hint}<p id="{id}-hint">{hint}</p>{/if}
			{@render children(control)}
			{@render notes()}
		</fieldset>
	{:else}
		<label for={id}>{@render title()}</label>
		{#if actions}<menu>{@render actions()}</menu>{/if}
		{#if hint}<p id="{id}-hint">{hint}</p>{/if}
		{@render children(control)}
		{@render notes()}
	{/if}
</enform-field>
