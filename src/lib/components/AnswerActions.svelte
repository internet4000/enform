<script lang="ts">
	// Answering a record with a type of its app that points at it (an RSVP to an event):
	// its form opens with the reference already set. Which type answers which is
	// inferred (describe/references), as no lexicon can say it.
	import {goto} from '$app/navigation'
	import * as m from '#lib/paraglide/messages.js'
	import {auth} from '#lib/auth/session.svelte'
	import type {Identity} from '#lib/atproto/identity'
	import type {RepoRecord} from '#lib/atproto/repo'
	import {appTypesOf} from '#lib/apps/apps'
	import {typeLabel} from '#lib/apps/directory'
	import {appOf} from '#lib/apps/names'
	import {answersTo, type Answer} from '#lib/describe/references'
	import {actorName, appScreenPath, newPath} from '#lib/paths'

	type Props = {
		repo: Identity
		record: RepoRecord
		/** Items only, for a menu around them */
		bare?: boolean
	}
	let {repo, record, bare = false}: Props = $props()

	let types = $derived(appTypesOf(record.collection).catch(() => []))
	let answers = $derived(types.then((list) => answersTo(record.collection, list)))

	/** The reference to this record: by its repo's DID (a local profile has none: its handle) */
	function reference(answer: Answer, list: Awaited<typeof types>) {
		const uri = `at://${repo.local ? (repo.handle ?? repo.did) : repo.did}/${record.collection}/${record.rkey}`
		const node = list.find((type) => type.nsid === answer.nsid)?.lexicon?.defs.main?.record
			?.properties?.[answer.field]
		return node?.type === 'string' ? uri : {uri, cid: record.cid}
	}

	async function answer(item: Answer) {
		const prefill = {[item.field]: reference(item, await types)}
		const href = auth.me
			? appScreenPath(actorName(auth.me), appOf(item.nsid), {type: item.nsid, create: true})
			: newPath(item.nsid)
		goto(href, {state: {prefill}})
	}
</script>

{#snippet items(list: Answer[])}
	{#each list as item (item.nsid + item.field)}
		<li>
			<button type="button" onclick={() => answer(item)}>
				{m.answer_with({type: typeLabel(item.nsid)})}
			</button>
		</li>
	{/each}
{/snippet}

{#await answers then list}
	{#if bare}
		{@render items(list)}
	{:else if list.length}
		<menu>{@render items(list)}</menu>
	{/if}
{/await}
