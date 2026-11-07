<script lang="ts">
	import * as m from '#lib/paraglide/messages.js'
	import Breadcrumbs from '#lib/components/Breadcrumbs.svelte'
	import FollowButton from '#lib/components/FollowButton.svelte'
	import LexiconStatus from '#lib/components/LexiconStatus.svelte'
	import RecordList from '#lib/components/RecordList.svelte'
	import {auth} from '#lib/auth/session.svelte'
	import {actorName, newPath} from '#lib/paths'

	let {data} = $props()
	let actor = $derived(actorName(data.repo))
</script>

<Breadcrumbs {actor} collection={data.collection} />
<section>
	<h2>{data.collection}</h2>
	<LexiconStatus nsid={data.collection} lexicon={data.lexicon} />
	<FollowButton subject={data.repo.did} collection={data.collection} />
	{#if auth.session}
		{#await data.lexicon then doc}
			{#if doc}
				<p>
					<a href={newPath(data.collection)} role="button">
						{auth.session.did === data.repo.did ? m.collection_new() : m.collection_new_yours()}
					</a>
				</p>
			{/if}
		{/await}
	{/if}
</section>
{#key data.collection + data.repo.did}
	<RecordList
		repo={data.repo}
		collection={data.collection}
		lexicon={data.lexicon}
		first={data.page}
	/>
{/key}
