<script lang="ts">
	// A union: which of its types, then that type's fields. The value carries the
	// member's $type. An open union may also hold a type it doesn't list.
	import * as m from '#lib/paraglide/messages.js'
	import {resolveRef, unionMember} from '#lib/lexicons/refs'
	import {initialValue} from '#lib/forms/initial'
	import {isObject} from '#lib/forms/types'
	import {refLabel, refType} from '#lib/forms/union'
	import Field from './Field.svelte'
	import FieldShell from './FieldShell.svelte'
	import JsonField from './JsonField.svelte'
	import ObjectField from './ObjectField.svelte'
	import type {FieldProps} from './context.svelte'

	let {node, value = $bindable(), base, name, path, required, item}: FieldProps = $props()

	let members = $derived(
		(node.refs ?? []).map((ref) => ({ref, type: refType(ref, base), label: refLabel(ref, base)}))
	)
	let typeName = $derived(
		isObject(value) && typeof value.$type === 'string' ? value.$type : undefined
	)
	let member = $derived(unionMember(node, typeName, base))
	let selected = $derived(member ? refType(member, base) : (typeName ?? ''))

	async function choose(type: string) {
		const chosen = members.find((option) => option.type === type)
		if (!chosen) {
			value = undefined
			return
		}
		value = {$type: type}
		const resolved = await resolveRef(chosen.ref, base)
		// Only if the choice still stands once its lexicon arrived
		if (resolved && isObject(value) && value.$type === type) {
			const initial = initialValue(resolved.node, resolved.nsid)
			value = {...(isObject(initial) ? initial : {}), $type: type}
		}
	}

	// A required union starts as its first type
	$effect.pre(() => {
		if (required && value === undefined && members.length) choose(members[0].type)
	})
</script>

<FieldShell {node} {value} {base} label={name} {path} {required} {item} group>
	{#snippet children({id})}
		<enform-union>
			<label for={id}>{m.form_union_type({name})}</label>
			<select {id} value={selected} onchange={(event) => choose(event.currentTarget.value)}>
				{#if !required}<option value="">{m.form_union_none()}</option>{/if}
				{#each members as option (option.type)}
					<option value={option.type} title={option.type}>{option.label}</option>
				{/each}
				{#if typeName && !member}
					<option value={typeName}>{m.form_union_other({type: typeName})}</option>
				{/if}
			</select>
		</enform-union>
		{#if member}
			{#await resolveRef(member, base) then resolved}
				{#if resolved?.node.description}<p>{resolved.node.description}</p>{/if}
				{#if resolved?.node.type === 'object'}
					<ObjectField
						bind:value
						node={resolved.node}
						base={resolved.nsid}
						{name}
						{path}
						required
						flat
					/>
				{:else if resolved}
					<Field
						bind:value
						node={resolved.node}
						base={resolved.nsid}
						{name}
						path={[...path, 'value']}
						required
						item
					/>
				{/if}
			{/await}
		{:else if typeName}
			<JsonField
				bind:value
				node={{type: 'unknown'}}
				{base}
				{name}
				path={[...path, 'value']}
				required
				item
			/>
		{/if}
	{/snippet}
</FieldShell>
