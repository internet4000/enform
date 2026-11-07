<script lang="ts">
	// A repo publishing lexicons: the apps it truly publishes, once in view
	import {appInfo} from '#lib/apps/directory'
	import {appsOf, type DiscoveredApp} from '#lib/apps/discover'
	import AppCard from './AppCard.svelte'
	import {whenVisible} from './visible'

	let {did, known}: {did: string; known: Set<string>} = $props()

	let apps = $state<Promise<DiscoveredApp[]>>()
</script>

{#if apps}
	{#await apps then list}
		{#each list.filter((found) => !known.has(found.namespace)) as found (found.namespace)}
			<AppCard app={appInfo(found.namespace)} type={found.types[0]} count={found.types.length} />
		{/each}
	{/await}
{:else}
	<enform-app-card loading {@attach whenVisible(() => (apps = appsOf(did)))}></enform-app-card>
{/if}
