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
	import {imageFields, richTextFields} from '#lib/forms/patterns'
	import {detect, facets as findFacets} from '#lib/forms/richtext'
	import {resolveHandle} from '#lib/atproto/identity'

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

	// An image fills its size sibling, and asks for its alt text next
	let image = $derived(imageFields(node))
	let lastImage: {width: number; height: number} | undefined
	$effect(() => {
		if (!image) return
		const size = form.images.get(form.fieldId([...path, image.image]))
		if (!size || size === lastImage) return
		lastImage = size
		untrack(() => {
			if (image.ratio && (!isObject(object[image.ratio]) || filledRatio)) {
				object[image.ratio] = {width: size.width, height: size.height}
				filledRatio = true
			}
			if (image.alt && !object[image.alt]) focusField(form.fieldId([...path, image.alt]))
		})
	})
	let filledRatio = false

	// A text with facets: its links, #tags and @mentions become its facets as it is typed
	let rich = $derived(richTextFields(node))
	let found = $derived(rich ? detect(String(object[rich.text] ?? '')) : [])
	let autoFacets = ''
	$effect(() => {
		if (!rich) return
		const text = String(object[rich.text] ?? '')
		const timer = setTimeout(async () => {
			const generated = await findFacets(text, (handle) => resolveHandle(handle))
			if (object[rich.text] !== text && text !== '') return
			const current = JSON.stringify(untrack(() => $state.snapshot(object[rich.facets])) ?? [])
			// What someone set by hand stays; what was generated before is replaced
			if (current !== '[]' && current !== autoFacets) return
			autoFacets = JSON.stringify(generated)
			object[rich.facets] = generated.length ? generated : undefined
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
	{#each keys.filter((key) => key !== rich?.facets) as key (key)}
		<Field
			node={properties[key]}
			bind:value={object[key]}
			{base}
			name={key}
			path={[...path, key]}
			required={!!node.required?.includes(key)}
		/>
		{#if key === rich?.text && found.length}
			<enform-facets aria-label={m.form_facets()}>
				{#each found as item, index (index)}
					<data value={item.kind}>{item.text}</data>
				{/each}
			</enform-facets>
		{/if}
	{/each}
{/snippet}

{#snippet all()}
	{@render fields(order.fields)}
	{#if order.automatic.length}
		<details>
			<summary>{m.form_more_options()}</summary>
			{@render fields(order.automatic)}
		</details>
	{/if}
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
