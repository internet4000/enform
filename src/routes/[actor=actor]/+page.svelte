<script lang="ts">
	import * as m from '#lib/paraglide/messages.js'
	import {actorName, collectionPath} from '#lib/paths'

	let {data} = $props()
	let actor = $derived(actorName(data.repo))
</script>

<enform-collections>
	<h2>{m.repo_collections()}</h2>
	{#each data.groups as group (group.authority)}
		<section>
			<h3><small>{group.authority}</small></h3>
			<ul>
				{#each group.collections as collection (collection)}
					<li><a href={collectionPath(actor, collection)}>{collection}</a></li>
				{/each}
			</ul>
		</section>
	{:else}
		<p>{m.repo_collections_empty()}</p>
	{/each}
</enform-collections>
