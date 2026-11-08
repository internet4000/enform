<script lang="ts">
	// Pins an app (or unpins it): in the rail and first on Home, on this device
	import * as m from '#lib/paraglide/messages.js'
	import {pins} from '#lib/apps/pins.svelte'

	let {domain, name}: {domain: string; name: string} = $props()
	let pinned = $derived(pins.has(domain))
</script>

<button
	type="button"
	aria-pressed={pinned}
	aria-label={pinned ? m.unpin_app({app: name}) : m.pin_app({app: name})}
	onclick={() => pins.toggle(domain)}
>
	{pinned ? m.unpin() : m.pin()}
</button>
