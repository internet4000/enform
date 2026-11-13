<script lang="ts">
	// A collection's pane: its records, newest first; the owner can add one
	import * as m from '#lib/paraglide/messages.js'
	import type {LexiconDoc} from '#lib/lexicons/types'
	import type {Identity} from '#lib/atproto/identity'
	import type {RepoRecord} from '#lib/atproto/repo'
	import {auth} from '#lib/auth/session.svelte'
	import {appInfo, typeLabel} from '#lib/apps/directory'
	import {namespaceOf} from '#lib/apps/names'
	import RecordList from '#lib/components/RecordList.svelte'
	import {actorName, createPath} from '#lib/paths'
	import Pane from './Pane.svelte'

	type Props = {
		repo: Identity
		collection: string
		lexicon: Promise<LexiconDoc | undefined>
		/** Its first page of records, being read */
		list: Promise<{records: RepoRecord[]; cursor?: string}>
		back?: {href: string; label: string}
	}
	let {repo, collection, lexicon, list, back}: Props = $props()
	let actor = $derived(actorName(repo))
	let owner = $derived(auth.owns(repo))
	let app = $derived(appInfo(namespaceOf(collection)))
</script>

<Pane title={typeLabel(collection)} subtitle={`${app.name} · ${collection}`} {back}>
	{#snippet actions()}
		{#if owner}
			{#await lexicon then doc}
				{#if doc}
					<li>
						<a href={createPath(actor, collection)} role="button">{m.collection_add()}</a>
					</li>
				{/if}
			{/await}
		{/if}
	{/snippet}
	{#await list}
		<p><small>{m.collection_loading()}</small></p>
	{:then first}
		{#key first}
			<RecordList {repo} {collection} {lexicon} {first} />
		{/key}
	{:catch err}
		<p role="alert">{err.message}</p>
	{/await}
</Pane>
