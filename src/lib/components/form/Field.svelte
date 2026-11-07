<script lang="ts">
	// A field for any lexicon node, by its type
	import StringField from './StringField.svelte'
	import IntegerField from './IntegerField.svelte'
	import BooleanField from './BooleanField.svelte'
	import ArrayField from './ArrayField.svelte'
	import ObjectField from './ObjectField.svelte'
	import RefField from './RefField.svelte'
	import UnionField from './UnionField.svelte'
	import BlobField from './BlobField.svelte'
	import JsonField from './JsonField.svelte'
	import type {FieldProps} from './context.svelte'

	let {value = $bindable(), ...props}: FieldProps = $props()
</script>

{#if props.node.type === 'string'}
	<StringField bind:value {...props} />
{:else if props.node.type === 'integer'}
	<IntegerField bind:value {...props} />
{:else if props.node.type === 'boolean'}
	<BooleanField bind:value {...props} />
{:else if props.node.type === 'array'}
	<ArrayField bind:value {...props} />
{:else if props.node.type === 'object'}
	<ObjectField bind:value {...props} />
{:else if props.node.type === 'ref'}
	<RefField bind:value {...props} />
{:else if props.node.type === 'union'}
	<UnionField bind:value {...props} />
{:else if props.node.type === 'blob'}
	<BlobField bind:value {...props} />
{:else}
	<JsonField bind:value {...props} />
{/if}
