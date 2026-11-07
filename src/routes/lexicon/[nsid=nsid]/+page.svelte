<script lang="ts">
	// A lexicon: what it defines, and a live preview of its record form. Submitting
	// writes nothing; it shows the record the form makes and whether it validates.
	import {tick} from 'svelte'
	import * as m from '#lib/paraglide/messages.js'
	import RecordForm from '#lib/components/form/RecordForm.svelte'
	import {lexiconClosure, validateRecord, type Validation} from '#lib/forms/validate'

	let {data} = $props()

	let lexicon = $derived(data.lexicon)
	let main = $derived(lexicon.defs.main)
	let result = $state<{value: Record<string, unknown>; validation: Validation}>()
	let output = $state<HTMLElement>()

	async function preview(value: Record<string, unknown>) {
		const docs = await lexiconClosure(lexicon.id)
		result = {value, validation: validateRecord(docs, lexicon.id, value)}
		await tick()
		output?.focus()
	}
</script>

<enform-page>
	<enform-lexicon-page>
		<header>
			<h1>{lexicon.id}</h1>
			{#if main?.key}<p><small>{m.lexicon_record_key({key: main.key})}</small></p>{/if}
		</header>

		{#if main?.type === 'record'}
			<section aria-labelledby="preview">
				<h2 id="preview">{m.lexicon_preview()}</h2>
				<p><small>{m.lexicon_preview_note()}</small></p>
				{#key lexicon.id}
					<RecordForm {lexicon} onsubmit={preview} submitLabel={m.lexicon_preview_submit()} />
				{/key}
			</section>
			{#if result}
				<section aria-labelledby="result" tabindex="-1" bind:this={output}>
					<h2 id="result">{m.lexicon_preview_result()}</h2>
					<enform-validation valid={result.validation.success || undefined}>
						<p role="status">
							{result.validation.success
								? m.lexicon_preview_valid()
								: m.lexicon_preview_invalid({error: result.validation.error})}
						</p>
					</enform-validation>
					<pre>{JSON.stringify(result.value, null, 2)}</pre>
				</section>
			{/if}
		{:else}
			{#if lexicon.description}<p>{lexicon.description}</p>{/if}
			<p>{m.lexicon_not_record({nsid: lexicon.id})}</p>
		{/if}

		<details>
			<summary>{m.lexicon_source()}</summary>
			<pre>{JSON.stringify(lexicon, null, 2)}</pre>
		</details>
	</enform-lexicon-page>
</enform-page>
