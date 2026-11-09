<script lang="ts">
	// A record three ways: as its kind shows it (a post's text, a link's preview, the
	// person followed), its fields as its lexicon names them, or its JSON. The choice is
	// remembered per type, on this device; a type with no kind to show starts on its fields.
	import * as m from '#lib/paraglide/messages.js'
	import type {Identity} from '#lib/atproto/identity'
	import type {RepoRecord} from '#lib/atproto/repo'
	import type {LexiconDoc} from '#lib/lexicons/types'
	import {kindOf} from '#lib/records/kinds'
	import KindView from './KindView.svelte'
	import RecordValue from '../RecordValue.svelte'

	type View = 'rendered' | 'fields' | 'json'
	type Props = {repo: Identity; record: RepoRecord; lexicon?: LexiconDoc; collection: string}
	let {repo, record, lexicon, collection}: Props = $props()

	const key = (type: string) => `enform:view:${type}`
	function remembered(type: string): View | undefined {
		try {
			const view = localStorage.getItem(key(type))
			return view === 'rendered' || view === 'fields' || view === 'json' ? view : undefined
		} catch {
			return undefined
		}
	}

	let chosen = $state<View>()
	let view = $derived(
		chosen ?? remembered(collection) ?? (kindOf(lexicon).kind === 'thing' ? 'fields' : 'rendered')
	)

	function choose(next: View) {
		chosen = next
		try {
			localStorage.setItem(key(collection), next)
		} catch {
			// Not remembered: private browsing, storage off
		}
	}

	const views: [View, () => string][] = [
		['rendered', m.view_rendered],
		['fields', m.view_fields],
		['json', m.view_json]
	]
</script>

<enform-record-views>
	<menu aria-label={m.view_label()}>
		{#each views as [name, label] (name)}
			<li>
				<button type="button" aria-pressed={view === name} onclick={() => choose(name)}
					>{label()}</button
				>
			</li>
		{/each}
	</menu>
	{#if view === 'rendered'}
		<KindView {repo} {record} {lexicon} />
	{:else if view === 'fields'}
		<RecordValue
			value={record.value}
			node={lexicon?.defs.main?.record}
			base={collection}
			{repo}
			typed={false}
		/>
	{:else}
		<pre>{JSON.stringify(record, null, 2)}</pre>
	{/if}
</enform-record-views>
