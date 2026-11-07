<script lang="ts">
	// A value of a record, shown from its lexicon node (followed through refs and unions)
	import RecordValue from './RecordValue.svelte'
	import StringValue from './StringValue.svelte'
	import BlobValue from './BlobValue.svelte'
	import * as m from '#lib/paraglide/messages.js'
	import type {Identity} from '#lib/atproto/identity'
	import {resolveRef} from '#lib/lexicons/refs'
	import type {LexNode} from '#lib/lexicons/types'
	import {objectKeys, shapeOf} from '#lib/records/shape'

	type Props = {
		value: unknown
		node?: LexNode
		/** NSID of the lexicon `node` is in, for relative refs */
		base: string
		repo: Identity
		/** False once a $type failed to resolve, so it isn't followed again */
		typed?: boolean
	}

	let {value, node, base, repo, typed = true}: Props = $props()

	let shape = $derived(shapeOf(value, node, base, typed))
	let object = $derived(value as Record<string, unknown>)
</script>

{#if shape.type === 'ref'}
	{#await resolveRef(shape.ref, base)}
		<RecordValue {value} {base} {repo} typed={false} />
	{:then resolved}
		<RecordValue
			{value}
			node={resolved?.node.type === 'record' ? resolved.node.record : resolved?.node}
			base={resolved?.nsid ?? base}
			{repo}
			typed={!!resolved}
		/>
	{/await}
{:else if shape.type === 'object'}
	<enform-value type="object">
		<dl>
			{#each objectKeys(object, shape.node) as key (key)}
				{@const child = shape.node?.properties?.[key]}
				<dt title={child?.description}>{key}</dt>
				<dd><RecordValue value={object[key]} node={child} {base} {repo} /></dd>
			{/each}
		</dl>
	</enform-value>
{:else if shape.type === 'array'}
	<enform-value type="array" empty={(value as unknown[]).length === 0 || undefined}>
		{#if (value as unknown[]).length === 0}
			{m.value_empty()}
		{:else}
			<ol>
				{#each value as unknown[] as item, index (index)}
					<li><RecordValue value={item} node={shape.items} {base} {repo} /></li>
				{/each}
			</ol>
		{/if}
	</enform-value>
{:else if shape.type === 'string'}
	<StringValue value={value as string} format={shape.format} />
{:else if shape.type === 'blob'}
	<BlobValue value={object} {repo} />
{:else if shape.type === 'boolean'}
	<enform-value type="boolean">{value ? m.value_true() : m.value_false()}</enform-value>
{:else if shape.type === 'integer'}
	<enform-value type="integer"><data value={String(value)}>{value}</data></enform-value>
{:else if shape.type === 'cid-link'}
	<enform-value type="cid-link"><code>{object.$link}</code></enform-value>
{:else if shape.type === 'bytes'}
	<enform-value type="bytes"><code>{object.$bytes}</code></enform-value>
{:else if shape.type === 'empty'}
	<enform-value type="empty" empty>{m.value_empty()}</enform-value>
{:else}
	<enform-value type="unknown"><code>{JSON.stringify(value)}</code></enform-value>
{/if}
