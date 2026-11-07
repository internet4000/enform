<script lang="ts">
	// A ref: resolved to its definition, then that definition's field. Strong refs get
	// their own field; a ref that can't be resolved is edited as JSON.
	import * as m from '#lib/paraglide/messages.js'
	import {resolveRef} from '#lib/lexicons/refs'
	import type {LexNode} from '#lib/lexicons/types'
	import {isStrongRef} from '#lib/forms/union'
	import Field from './Field.svelte'
	import JsonField from './JsonField.svelte'
	import StrongRefField from './StrongRefField.svelte'
	import type {FieldProps} from './context.svelte'

	let {value = $bindable(), ...props}: FieldProps = $props()

	let ref = $derived(props.node.ref ?? '')

	/** The target's node, described by the ref when the target says nothing */
	function target(node: LexNode): LexNode {
		const own = node.type === 'record' && node.record ? node.record : node
		return {...own, description: props.node.description ?? own.description}
	}
</script>

{#if isStrongRef(ref, props.base)}
	<StrongRefField bind:value {...props} />
{:else}
	{#await resolveRef(ref, props.base)}
		<enform-field type="ref" loading>
			<p aria-busy="true">{m.form_ref_loading({ref})}</p>
		</enform-field>
	{:then resolved}
		{#if resolved && resolved.node.type !== 'token'}
			<Field bind:value {...props} node={target(resolved.node)} base={resolved.nsid} />
		{:else}
			<JsonField bind:value {...props} notice={m.form_ref_unresolved({ref})} />
		{/if}
	{/await}
{/if}
