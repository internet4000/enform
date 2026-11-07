<script lang="ts">
	// An integer: a number input within its bounds, or a select of its enum
	import * as m from '#lib/paraglide/messages.js'
	import FieldShell from './FieldShell.svelte'
	import type {FieldProps} from './context.svelte'

	let {node, value = $bindable(), base, name, path, required, item}: FieldProps = $props()

	let number = $derived(typeof value === 'number' && !Number.isNaN(value) ? value : undefined)

	function parse(text: string): number | undefined {
		return text === '' || Number.isNaN(Number(text)) ? undefined : Number(text)
	}
</script>

<FieldShell {node} {value} {base} label={name} {path} {required} {item}>
	{#snippet children({id, describedby, invalid})}
		{#if node.enum}
			<select
				{id}
				aria-describedby={describedby}
				aria-invalid={invalid}
				value={number === undefined ? '' : String(number)}
				onchange={(event) => (value = parse(event.currentTarget.value))}
			>
				<option value="" disabled={required}>{m.form_choose()}</option>
				{#each node.enum as option (option)}
					<option value={String(option)}>{option}</option>
				{/each}
			</select>
		{:else}
			<input
				{id}
				type="number"
				inputmode="numeric"
				step="1"
				min={node.minimum}
				max={node.maximum}
				aria-describedby={describedby}
				aria-invalid={invalid}
				value={number ?? ''}
				oninput={(event) => (value = parse(event.currentTarget.value))}
			/>
		{/if}
	{/snippet}
</FieldShell>
