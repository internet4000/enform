<script lang="ts">
	import * as m from '#lib/paraglide/messages.js'
	import Breadcrumbs from '#lib/components/Breadcrumbs.svelte'
	import RecordValue from '#lib/components/RecordValue.svelte'
	import {actorName} from '#lib/paths'

	let {data} = $props()
	let actor = $derived(actorName(data.repo))
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
