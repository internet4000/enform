<script lang="ts">
	import * as m from '#lib/paraglide/messages.js'
	import Breadcrumbs from '#lib/components/Breadcrumbs.svelte'
	import RecordValue from '#lib/components/RecordValue.svelte'
	import RecordActions from '#lib/components/RecordActions.svelte'
	import {auth} from '#lib/auth/session.svelte'
	import {actorName, editPath} from '#lib/paths'

	let {data} = $props()
	let actor = $derived(actorName(data.repo))
	let owner = $derived(auth.session?.did === data.repo.did)
</script>

<Breadcrumbs {actor} collection={data.collection} rkey={data.rkey} />
<enform-record>
	{#await data.lexicon}
		<RecordValue value={data.record.value} base={data.collection} repo={data.repo} typed={false} />
	{:then lexicon}
		<RecordValue
			value={data.record.value}
			node={lexicon?.defs.main?.record}
			base={data.collection}
			repo={data.repo}
			typed={false}
		/>
	{/await}
</enform-record>
<details>
	<summary>{m.record_raw()}</summary>
	<pre>{JSON.stringify(data.record, null, 2)}</pre>
</details>
{#if owner}
	<RecordActions
		{actor}
		collection={data.collection}
		rkey={data.rkey}
		cid={data.record.cid}
		editHref={editPath(actor, data.collection, data.rkey)}
	/>
{/if}
