<script lang="ts">
	// A record's images, one after another as a slideshow; done after the last one
	import {onDestroy} from 'svelte'
	import app from '#lib/config/app.json' with {type: 'json'}
	import type {Identity} from '#lib/atproto/identity'
	import {blobUrl} from '#lib/atproto/repo'

	type Props = {repo: Identity; cids: string[]; alts: string[]; onended: () => void}
	let {repo, cids, alts, onended}: Props = $props()

	let shown = $state(0)
	const timer = setInterval(() => {
		if (shown < cids.length - 1) shown++
		else onended()
	}, app.reader.slideSeconds * 1000)
	onDestroy(() => clearInterval(timer))
</script>

<enform-images>
	{#if !repo.local}
		<img src={blobUrl(repo, cids[shown])} alt={alts[shown] ?? ''} />
	{/if}
	{#if cids.length > 1}
		<menu>
			{#each cids as cid, index (cid)}
				<li>
					<button type="button" aria-pressed={index === shown} onclick={() => (shown = index)}>
						{index + 1}
					</button>
				</li>
			{/each}
		</menu>
	{/if}
</enform-images>
