<script lang="ts">
	// A boolean: a checkbox. Unchecking an optional one leaves it out, unless its
	// default is true, where false has to be said.
	import FieldShell from './FieldShell.svelte'
	import type {FieldProps} from './context.svelte'

	let {node, value = $bindable(), base, name, path, required, item}: FieldProps = $props()

	function change(checked: boolean) {
		value = checked || (required || node.default === true ? false : undefined)
	}
</script>

<FieldShell {node} {value} {base} label={name} {path} {required} {item}>
	{#snippet children({id, describedby, invalid})}
		<input
			{id}
			type="checkbox"
			aria-describedby={describedby}
			aria-invalid={invalid}
			checked={value === true}
			disabled={node.const !== undefined}
			onchange={(event) => change(event.currentTarget.checked)}
		/>
	{/snippet}
</FieldShell>
