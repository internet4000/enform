<script lang="ts">
	// A map to pick a point: tap to place it; it follows the point when set from outside.
	// MapLibre is loaded only when a map is shown.
	import * as m from '#lib/paraglide/messages.js'
	import app from '#lib/config/app.json' with {type: 'json'}
	import type {Map as MapLibre, Marker} from 'maplibre-gl'

	type Point = {latitude: number; longitude: number}
	let {point, onpick}: {point?: Point; onpick: (point: Point) => void} = $props()

	let container = $state<HTMLElement>()
	let map: MapLibre | undefined
	let marker: Marker | undefined

	$effect(() => {
		if (!container) return
		let cancelled = false
		;(async () => {
			const maplibre = await import('maplibre-gl')
			await import('maplibre-gl/dist/maplibre-gl.css')
			if (cancelled || !container) return
			map = new maplibre.Map({
				container,
				style: {
					version: 8,
					sources: {
						tiles: {
							type: 'raster',
							tiles: [app.services.mapStyle.tiles],
							tileSize: 256,
							attribution: app.services.mapStyle.attribution
						}
					},
					layers: [{id: 'tiles', type: 'raster', source: 'tiles'}]
				},
				center: point ? [point.longitude, point.latitude] : [0, 20],
				zoom: point ? 13 : 1
			})
			marker = new maplibre.Marker()
			if (point) marker.setLngLat([point.longitude, point.latitude]).addTo(map)
			map.on('click', (event) => {
				marker?.setLngLat(event.lngLat).addTo(map!)
				onpick({latitude: event.lngLat.lat, longitude: event.lngLat.lng})
			})
		})()
		return () => {
			cancelled = true
			map?.remove()
		}
	})

	// A point set from outside (located, searched): the map goes there
	$effect(() => {
		if (!point || !map || !marker) return
		marker.setLngLat([point.longitude, point.latitude]).addTo(map)
		map.flyTo({center: [point.longitude, point.latitude], zoom: Math.max(map.getZoom(), 13)})
	})
</script>

<enform-map bind:this={container} role="application" aria-label={m.place_map()}></enform-map>
