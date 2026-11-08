<script lang="ts">
	// A place: its name and coordinates, to open on a map
	import * as m from '#lib/paraglide/messages.js'
	import app from '#lib/config/app.json' with {type: 'json'}

	let {latitude, longitude, name}: {latitude: number; longitude: number; name?: string} = $props()
	let href = $derived(
		app.services.mapLink
			.replaceAll('{lat}', String(latitude))
			.replaceAll('{lon}', String(longitude))
	)
</script>

<enform-place>
	{#if name}<strong>{name}</strong>{/if}
	<a {href} rel="noopener noreferrer external" target="_blank">
		{m.place_open({coordinates: `${latitude.toFixed(4)}, ${longitude.toFixed(4)}`})}
	</a>
</enform-place>
