<script lang="ts">
	// A record three ways: as its kind shows it (a post's text, a link's preview, the
	// person followed), its fields as its lexicon names them, or its JSON. The choice is
	// remembered per type, on this device. Rendered first: a record with no kind to show it by
	// (no lexicon) is rendered from its values, as its card is.
	// Over it, one bar: what one can do with it (its actions), then how to see it.
	import type {Snippet} from 'svelte'
	import * as m from '#lib/paraglide/messages.js'
	import type {Identity} from '#lib/atproto/identity'
	import type {RepoRecord} from '#lib/atproto/repo'
	import type {LexiconDoc} from '#lib/lexicons/types'
	import KindView from './KindView.svelte'
	import RecordValue from '../RecordValue.svelte'

	type View = 'rendered' | 'fields' | 'json'
	type Props = {
		repo: Identity
		record: RepoRecord
		lexicon?: LexiconDoc
		collection: string
		/** The view to start on, until one is chosen for its type */
		initial?: View
		/** What one can do with it, at the bar's start */
		actions?: Snippet
	}
	let {repo, record, lexicon, collection, initial, actions}: Props = $props()

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
	let view = $derived(chosen ?? remembered(collection) ?? initial ?? 'rendered')

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
	<enform-record-bar>
		{@render actions?.()}
		<menu aria-label={m.view_label()}>
			{#each views as [name, label] (name)}
				<li>
					<button type="button" aria-pressed={view === name} onclick={() => choose(name)}
						>{label()}</button
					>
				</li>
			{/each}
		</menu>
	</enform-record-bar>
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
