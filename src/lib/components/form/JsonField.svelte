<script lang="ts">
	// A value with no form of its own (unknown, cid-link, bytes, or an unresolved ref),
	// written as JSON
	import * as m from '#lib/paraglide/messages.js'
	import FieldShell from './FieldShell.svelte'
	import type {FieldProps} from './context.svelte'

	let {
		node,
		value = $bindable(),
		base,
		name,
		path,
		required,
		item,
		notice
	}: FieldProps & {notice?: string} = $props()

	const stringify = (json: unknown) => (json === undefined ? '' : JSON.stringify(json, null, 2))

	// What's typed, kept as is while it doesn't parse
	let text = $state(stringify(value))
	let error = $state<string>()

	function input(next: string) {
		text = next
		if (!next.trim()) {
			value = undefined
			error = undefined
			return
		}
		try {
			value = JSON.parse(next)
			error = undefined
		} catch (err) {
			error = m.form_json_invalid({message: (err as Error).message})
		}
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
	problems={error ? [error] : []}
>
	{#snippet children({id, describedby, invalid})}
		<textarea
			{id}
			aria-describedby={describedby}
			aria-invalid={invalid}
			value={text}
			oninput={(event) => input(event.currentTarget.value)}
			rows="4"
			spellcheck="false"
			autocapitalize="off"></textarea>
	{/snippet}
	{#snippet footer()}
		<small>{notice ?? m.form_json_hint()}</small>
	{/snippet}
</FieldShell>
