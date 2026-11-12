<script lang="ts">
	// A record three ways: as its kind shows it (a post's text, a link's preview, the
	// person followed), its fields as its lexicon names them, or its JSON. The view is in
	// the address (?view=fields), so a link shares it; rendered when none is: a record with
	// no kind to show it by (no lexicon) is rendered from its values, as its card is.
	// Over it, one bar: how to see it, then what one can do with it (its actions).
	import type {Snippet} from 'svelte'
	import * as m from '#lib/paraglide/messages.js'
	import type {Identity} from '#lib/atproto/identity'
	import type {RepoRecord} from '#lib/atproto/repo'
	import type {LexiconDoc} from '#lib/lexicons/types'
	import {shownUrl} from '#lib/where.svelte'
	import {hrefOf} from '#lib/paths'
	import KindView from './KindView.svelte'
	import RecordValue from '../RecordValue.svelte'

	type View = 'rendered' | 'fields' | 'json'
	type Props = {
		repo: Identity
		record: RepoRecord
		lexicon?: LexiconDoc
		collection: string
		/** What one can do with it, after how to see it */
		actions?: Snippet
	}
	let {repo, record, lexicon, collection, actions}: Props = $props()

	const views: [View, () => string][] = [
		['rendered', m.view_rendered],
		['fields', m.view_fields],
		['json', m.view_json]
	]
	let view = $derived.by((): View => {
		const asked = shownUrl().searchParams.get('view')
		return views.find(([name]) => name === asked)?.[0] ?? 'rendered'
	})
	/** Where one sees it as a view: here, its address with that view (rendered: none) */
	function at(name: View): string {
		const address = shownUrl()
		if (name === 'rendered') address.searchParams.delete('view')
		else address.searchParams.set('view', name)
		return hrefOf(address)
	}
</script>

<enform-record-views>
	<enform-record-bar>
		<menu aria-label={m.view_label()}>
			{#each views as [name, label] (name)}
				<li>
					<a
						href={at(name)}
						role="button"
						aria-current={view === name ? 'true' : undefined}
						data-sveltekit-replacestate
						data-sveltekit-noscroll
						data-sveltekit-keepfocus>{label()}</a
					>
				</li>
			{/each}
		</menu>
		{@render actions?.()}
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
