<script lang="ts">
	// A com.atproto.repo.strongRef: an at:// URI typed in, the record fetched from its
	// repo's PDS for its CID, and summarized so people see what they point to. What it
	// points at is inferred (describe/references): said, and yours of it to pick from.
	import {onMount} from 'svelte'
	import {AtUri, isValidAtUri} from '@atproto/syntax'
	import * as m from '#lib/paraglide/messages.js'
	import {resolveIdentity} from '#lib/atproto/identity'
	import {getRecord, listRecords, type RepoRecord} from '#lib/atproto/repo'
	import {auth} from '#lib/auth/session.svelte'
	import {appTypesOf} from '#lib/apps/apps'
	import {typeLabel} from '#lib/apps/directory'
	import {referencesOf, type Reference} from '#lib/describe/references'
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

	const because = {
		records: m.references_because_records,
		described: m.references_because_described,
		app: m.references_because_app
	}

	/** What a field of the record points at, inferred from its app's types */
	let reference: Promise<Reference | undefined> = $derived(
		path.length === 1
			? appTypesOf(base)
					.then((types) =>
						referencesOf(base, types.find((type) => type.nsid === base)?.lexicon, types).find(
							(found) => found.field === path[0]
						)
					)
					.catch(() => undefined)
			: Promise.resolve(undefined)
	)
	/** Records of that type in the repo of who acts, to pick from */
	let yours: Promise<RepoRecord[]> = $derived(
		reference.then(async (found) => {
			const target = found?.targets[0]
			if (!target || !auth.me) return []
			const page = await listRecords(auth.me, target, undefined, 12).catch(() => undefined)
			return page?.records ?? []
		})
	)

	function pick(record: RepoRecord) {
		input(record.uri)
		lookup(record.uri, true)
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
			// A strong ref names its repo by DID, which outlives handles; a local profile has
			// none, so by its handle, on this device
			const host = repo.local ? at.host : repo.did
			if (pin) value = {uri: `at://${host}/${at.collection}/${at.rkey}`, cid: record.cid}
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
			{#await reference then found}
				{#if found?.because}
					<small>
						{m.form_strongref_points({
							type: found.targets.map(typeLabel).join(', '),
							because: because[found.because]()
						})}
					</small>
				{/if}
			{/await}
			{#await yours then records}
				{#if records.length}
					<enform-strongref-pick>
						<small>{m.form_strongref_yours()}</small>
						<ul>
							{#each records as record (record.uri)}
								<li>
									<button
										type="button"
										aria-pressed={record.uri === uri}
										onclick={() => pick(record)}
									>
										{recordSummary(record.value) ?? record.rkey}
									</button>
								</li>
							{/each}
						</ul>
					</enform-strongref-pick>
				{/if}
			{/await}
		</enform-strongref>
	{/snippet}
</FieldShell>
