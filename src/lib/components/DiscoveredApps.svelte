<script lang="ts">
	// Every other app of the atmosphere: the repos publishing lexicons, a page at a time,
	// each read once in view, showing the apps it truly publishes
	import * as m from '#lib/paraglide/messages.js'
	import app from '#lib/config/app.json' with {type: 'json'}
	import {directoryApps} from '#lib/apps/directory'
	import {lexiconPublishers} from '#lib/apps/discover'
	import Publisher from './Publisher.svelte'

	const known = new Set(
		directoryApps()
			.map((info) => info.namespace)
			.concat('com.atproto')
	)
	let shown = $state(app.reads.discoverPage)
	const publishers = lexiconPublishers()
</script>

{#await publishers}
	<p><small>{m.collection_loading()}</small></p>
{:then dids}
	<p><small>{m.discover_count({count: String(dids.length)})}</small></p>
	<enform-app-cards>
		{#each dids.slice(0, shown) as did (did)}
			<Publisher {did} {known} />
		{/each}
	</enform-app-cards>
	{#if shown < dids.length}
		<button type="button" onclick={() => (shown += app.reads.discoverPage)}>
			{m.collection_load_more()}
		</button>
	{/if}
{:catch}
	<p><small>{m.discover_unavailable()}</small></p>
{/await}
