<script lang="ts">
	// An app's icon (its account's avatar), else its initial
	import {appIcon} from '#lib/apps/directory'

	let {domain, name}: {domain: string; name: string} = $props()
	let icon = $derived(appIcon(domain))
</script>

<enform-app-icon>
	{#await icon then src}
		{#if src}<img {src} alt="" loading="lazy" />{:else}{name.charAt(0).toUpperCase()}{/if}
	{/await}
</enform-app-icon>
