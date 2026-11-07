<script lang="ts">
	// A com.atproto.repo.strongRef: an at:// URI typed in, the record fetched from its
	// repo's PDS for its CID, and summarized so people see what they point to.
	import {onMount} from 'svelte'
	import {AtUri, isValidAtUri} from '@atproto/syntax'
	import * as m from '#lib/paraglide/messages.js'
	import {resolveIdentity} from '#lib/atproto/identity'
	import {getRecord} from '#lib/atproto/repo'
	import {atUriPath} from '#lib/paths'
	import {recordSummary} from '#lib/records/summary'
	import {isObject} from '#lib/forms/types'
	import FieldShell from './FieldShell.svelte'
	import type {FieldProps} from './context.svelte'

	let {node, value = $bindable(), base, name, path, required, item}: FieldProps = $props()

	let uri = $derived(isObject(value) && typeof value.uri === 'string' ? value.uri : '')
	let cid = $derived(isObject(value) && typeof value.cid === 'string' ? value.cid : '')
	let loading = $state(false)
	let failure = $state<string>()
	let summary = $state<string>()
	let uriNode = $derived({type: 'string', format: 'at-uri', description: node.description})

	function input(text: string) {
		failure = summary = undefined
		value = text || required ? {uri: text, cid: ''} : undefined
	}

	/** Fetch the record the URI names; `pin` sets the CID to its current version */
	async function lookup(target: string, pin: boolean) {
		if (!isValidAtUri(target)) return
		const at = new AtUri(target)
		if (!at.collection || !at.rkey) return
		loading = true
		failure = undefined
		try {
			const repo = await resolveIdentity(at.host)
			const record = await getRecord(repo, at.collection, at.rkey)
			if (target !== uri) return
			// A strong ref names its repo by DID, which outlives handles
			if (pin) value = {uri: `at://${repo.did}/${at.collection}/${at.rkey}`, cid: record.cid}
			summary = recordSummary(record.value) ?? at.rkey
		} catch (err) {
			if (target === uri) failure = m.form_strongref_failed({message: (err as Error).message})
		} finally {
			loading = false
		}
	}

	// Editing: show what the stored ref points to, keeping its CID as it is
	onMount(() => {
		if (uri && cid) lookup(uri, false)
	})
</script>

<FieldShell
	node={uriNode}
	value={uri || (required ? '' : undefined)}
	{base}
	label={name}
	{path}
	{required}
	{item}
	problems={failure ? [failure] : []}
	busy={loading}
>
	{#snippet children({id, describedby, invalid})}
		<input
			{id}
			type="text"
			inputmode="url"
			autocomplete="off"
			autocapitalize="off"
			spellcheck="false"
			aria-describedby={describedby}
			aria-invalid={invalid}
			aria-busy={loading}
			value={uri}
			oninput={(event) => input(event.currentTarget.value.trim())}
			onchange={() => lookup(uri, true)}
		/>
	{/snippet}
	{#snippet footer()}
		<enform-strongref loading={loading || undefined}>
			{#if loading}
				<small aria-live="polite">{m.form_strongref_loading()}</small>
			{:else if summary && cid}
				<dl>
					<dt>{m.form_strongref_found()}</dt>
					<dd><a href={atUriPath(uri)} target="_blank" rel="noopener">{summary}</a></dd>
					<dt>{m.form_strongref_cid()}</dt>
					<dd><code>{cid}</code></dd>
				</dl>
			{:else}
				<small>{m.form_strongref_hint()}</small>
			{/if}
		</enform-strongref>
	{/snippet}
</FieldShell>
