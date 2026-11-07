<script lang="ts">
	// An object: its fields in a fieldset. An optional one is added and removed on
	// purpose; `flat` lays the fields out bare, for a record or a union member.
	import * as m from '#lib/paraglide/messages.js'
	import {initialValue} from '#lib/forms/initial'
	import {fieldOrder} from '#lib/forms/order'
	import {isObject, type AnyObject} from '#lib/forms/types'
	import Field from './Field.svelte'
	import FieldShell from './FieldShell.svelte'
	import {focusField, getForm, type FieldProps} from './context.svelte'
	import {tick, untrack} from 'svelte'
	import {enrichment, linkFields} from '#lib/forms/enrich'
	import {isWebLink, linkDetails} from '#lib/links/details'

	let {
		node,
		value = $bindable(),
		base,
		name,
		path,
		required,
		item,
		flat = false
	}: FieldProps & {flat?: boolean} = $props()

	const form = getForm()
	let order = $derived(fieldOrder(node))
	let object = $derived(isObject(value) ? value : ({} as AnyObject))
	let properties = $derived(node.properties ?? {})

	// A required object is always there to fill in
	$effect.pre(() => {
		if ((required || flat) && !isObject(value)) value = initialValue(node, base)
	})

	// A web link fills its empty title and description siblings (by lexicon shape)
	const filled: Record<string, string> = {}
	$effect(() => {
		const key = linkFields(node).find((name) => isWebLink(object[name]))
		if (!key) return
		const url = object[key] as string
		const timer = setTimeout(async () => {
			const details = await linkDetails(url)
			if (!details || object[key] !== url) return
			const patch = enrichment(
				node,
				untrack(() => $state.snapshot(object)),
				details,
				filled
			)
			for (const [name, text] of Object.entries(patch)) {
				object[name] = text
				filled[name] = text
			}
		}, 400)
		return () => clearTimeout(timer)
	})

	async function add() {
		value = initialValue(node, base)
		await tick()
		focusField(form.fieldId(path))
	}

	async function remove() {
		value = undefined
		await tick()
		focusField(`${form.fieldId(path)}-add`)
	}
</script>

{#snippet fields(keys: string[])}
	{#each keys as key (key)}
		<Field
			node={properties[key]}
			bind:value={object[key]}
			{base}
			name={key}
			path={[...path, key]}
			required={!!node.required?.includes(key)}
		/>
	{/each}
{/snippet}

{#snippet all()}
	{@render fields(order.fields)}
	{#if order.deprecated.length}
		<details>
			<summary>{m.form_deprecated()}</summary>
			{@render fields(order.deprecated)}
		</details>
	{/if}
{/snippet}

{#if flat}
	<enform-fields>{@render all()}</enform-fields>
{:else if !isObject(value)}
	<enform-field type="object" absent>
		<button type="button" id="{form.fieldId(path)}-add" value="add" onclick={add}>
			{m.form_add({name})}
		</button>
		{#if node.description}<p>{node.description}</p>{/if}
	</enform-field>
{:else}
	<FieldShell {node} {value} {base} label={name} {path} {required} {item} group>
		{#snippet actions()}
			{#if !required && !item}
				<li><button type="button" onclick={remove}>{m.form_remove({name})}</button></li>
			{/if}
		{/snippet}
		<enform-fields>{@render all()}</enform-fields>
	</FieldShell>
{/if}
