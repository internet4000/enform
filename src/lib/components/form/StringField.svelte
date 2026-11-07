<script lang="ts">
	// A string: a line, a textarea, a select of its enum, or a date and time picker
	import * as m from '#lib/paraglide/messages.js'
	import {getLocale} from '#lib/paraglide/runtime.js'
	import {inputType, isIdentifier, stringControl, suggestedLanguages} from '#lib/forms/controls'
	import {fromLocalInput, localTimeZone, toLocalInput} from '#lib/forms/datetime'
	import {graphemeLength} from '#lib/forms/text'
	import {isWebLink} from '#lib/links/details'
	import FieldShell from './FieldShell.svelte'
	import LinkPreview from './LinkPreview.svelte'
	import type {FieldProps} from './context.svelte'

	let {node, value = $bindable(), base, name, path, required, item}: FieldProps = $props()

	let key = $derived(String(path.at(-1) ?? ''))
	let control = $derived(stringControl(node, key))
	let text = $derived(typeof value === 'string' ? value : '')
	let identifier = $derived(isIdentifier(node.format))
	let suggestions = $derived.by(() => {
		if (node.knownValues) {
			return node.knownValues.map((known) => ({value: known, label: known.split('#').pop()}))
		}
		if (node.format === 'language') {
			const names = new Intl.DisplayNames([getLocale()], {type: 'language'})
			return suggestedLanguages(navigator.languages).map((code) => ({
				value: code,
				label: names.of(code)
			}))
		}
		return undefined
	})
	let count = $derived(node.maxGraphemes === undefined ? 0 : graphemeLength(text))

	function input(event: Event & {currentTarget: {value: string}}) {
		value = event.currentTarget.value
	}
</script>

<FieldShell {node} {value} {base} label={name} {path} {required} {item}>
	{#snippet children({id, describedby, invalid})}
		{#if control === 'select'}
			<select
				{id}
				aria-describedby={describedby}
				aria-invalid={invalid}
				value={text}
				onchange={input}
			>
				<option value="" disabled={required}>{m.form_choose()}</option>
				{#each node.enum ?? [] as option (option)}
					<option value={option}>{option}</option>
				{/each}
			</select>
		{:else if control === 'datetime'}
			<enform-datetime>
				<input
					{id}
					type="datetime-local"
					aria-describedby={describedby}
					aria-invalid={invalid}
					value={toLocalInput(value)}
					oninput={(event) => (value = fromLocalInput(event.currentTarget.value))}
				/>
				<button type="button" onclick={() => (value = new Date().toISOString())}>
					{m.form_now()}
				</button>
			</enform-datetime>
		{:else if control === 'textarea'}
			<textarea
				{id}
				aria-describedby={describedby}
				aria-invalid={invalid}
				value={text}
				oninput={input}
				rows="3"></textarea>
		{:else}
			<input
				{id}
				type={inputType(node.format)}
				aria-describedby={describedby}
				aria-invalid={invalid}
				value={text}
				oninput={input}
				list={suggestions ? `${id}-suggestions` : undefined}
				autocomplete="off"
				autocapitalize={identifier ? 'off' : undefined}
				spellcheck={identifier ? 'false' : undefined}
			/>
			{#if suggestions}
				<datalist id="{id}-suggestions">
					{#each suggestions as suggestion (suggestion.value)}
						<option value={suggestion.value} label={suggestion.label}></option>
					{/each}
				</datalist>
			{/if}
		{/if}
	{/snippet}
	{#snippet footer()}
		{#if node.maxGraphemes !== undefined}
			<enform-counter over={count > node.maxGraphemes || undefined}>
				<output>{m.form_counter({count, max: node.maxGraphemes})}</output>
			</enform-counter>
		{:else if control === 'datetime'}
			<small>{m.form_timezone({zone: localTimeZone()})}</small>
		{:else if node.format === 'uri' && isWebLink(text)}
			<LinkPreview url={text} />
		{/if}
	{/snippet}
</FieldShell>
