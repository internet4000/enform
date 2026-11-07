<script lang="ts">
	import * as m from '#lib/paraglide/messages.js'
	import Breadcrumbs from '#lib/components/Breadcrumbs.svelte'
	import LexiconStatus from '#lib/components/LexiconStatus.svelte'
	import RecordList from '#lib/components/RecordList.svelte'
	import {actorName} from '#lib/paths'

	let {data} = $props()
	let actor = $derived(actorName(data.repo))
</script>

<Breadcrumbs {actor} collection={data.collection} />
<section>
	<h2>{data.collection}</h2>
	<LexiconStatus nsid={data.collection} lexicon={data.lexicon} />
</section>
{#key data.collection + data.repo.did}
	<RecordList
		repo={data.repo}
		collection={data.collection}
		lexicon={data.lexicon}
		first={data.page}
	/>
{/key}
