<script lang="ts">
	// A list: items added, removed and moved, within the lexicon's bounds
	import {tick} from 'svelte'
	import * as m from '#lib/paraglide/messages.js'
	import {initialValue} from '#lib/forms/initial'
	import Field from './Field.svelte'
	import FieldShell from './FieldShell.svelte'
	import {focusField, focusFieldSoon, getForm, type FieldProps} from './context.svelte'

	let {node, value = $bindable(), base, name, path, required, item}: FieldProps = $props()

	const form = getForm()
	let items = $derived(Array.isArray(value) ? value : [])
	let itemNode = $derived(node.items ?? {type: 'unknown'})
	let full = $derived(node.maxLength !== undefined && items.length >= node.maxLength)
	// Blank rows of string lists are dropped when cleaned, so they're never missing
	let itemRequired = $derived(itemNode.type !== 'string')
	let id = $derived(form.fieldId(path))

	const label = (index: number) => m.form_item_label({name, index: index + 1})

	async function add() {
		value = [...items, initialValue(itemNode, base)]
		await tick()
		focusFieldSoon(`${id}-${items.length - 1}`)
	}

	async function remove(index: number) {
		value = items.toSpliced(index, 1)
		await tick()
		focusField(items.length ? `${id}-${Math.min(index, items.length - 1)}` : `${id}-add`)
	}

	async function move(index: number, by: -1 | 1) {
		const next = items.slice()
		;[next[index], next[index + by]] = [next[index + by], next[index]]
		value = next
		await tick()
		// Follow the moved item, on the other arrow once it reached an end
		const to = index + by
		const end = by < 0 ? to === 0 : to === items.length - 1
		focusField(`${id}-${to}-${by < 0 !== end ? 'up' : 'down'}`)
	}
</script>

<FieldShell {node} {value} {base} label={name} {path} {required} {item} group>
	<enform-list items={itemNode.type}>
		{#if items.length}
			<ol>
				{#each items as _, index (index)}
					<li>
						<Field
							node={itemNode}
							bind:value={items[index]}
							{base}
							name={label(index)}
							path={[...path, index]}
							required={itemRequired}
							item
						/>
						<menu>
							<li>
								<button
									type="button"
									value="up"
									id="{id}-{index}-up"
									aria-label={m.form_item_move_up({item: label(index)})}
									title={m.form_item_move_up({item: label(index)})}
									disabled={index === 0}
									onclick={() => move(index, -1)}
								></button>
							</li>
							<li>
								<button
									type="button"
									value="down"
									id="{id}-{index}-down"
									aria-label={m.form_item_move_down({item: label(index)})}
									title={m.form_item_move_down({item: label(index)})}
									disabled={index === items.length - 1}
									onclick={() => move(index, 1)}
								></button>
							</li>
							<li>
								<button
									type="button"
									value="remove"
									aria-label={m.form_item_remove({item: label(index)})}
									title={m.form_item_remove({item: label(index)})}
									onclick={() => remove(index)}
								></button>
							</li>
						</menu>
					</li>
				{/each}
			</ol>
		{/if}
		<footer>
			<button type="button" id="{id}-add" value="add" disabled={full} onclick={add}>
				{m.form_array_add({name})}
			</button>
			{#if node.maxLength !== undefined}
				<small>{m.form_array_count({count: items.length, max: node.maxLength})}</small>
			{/if}
		</footer>
	</enform-list>
</FieldShell>
