<script lang="ts">
	// Picking a place for latitude/longitude fields (any lexicon with that shape): your
	// location, an address, or a tap on the map. The fields stay below, to edit as numbers.
	import * as m from '#lib/paraglide/messages.js'
	import {getLocale} from '#lib/paraglide/runtime.js'
	import type {LexNode} from '#lib/lexicons/types'
	import type {PlaceFields} from '#lib/forms/patterns'
	import {locate, searchPlaces, type Place} from '#lib/links/geocode'
	import MapPicker from './MapPicker.svelte'

	type Props = {node: LexNode; object: Record<string, unknown>; fields: PlaceFields}
	let {node, object, fields}: Props = $props()

	let query = $state('')
	let results = $state<Place[]>([])
	let busy = $state(false)
	let failed = $state<string>()

	let point = $derived.by(() => {
		const latitude = Number(object[fields.latitude])
		const longitude = Number(object[fields.longitude])
		return object[fields.latitude] !== undefined &&
			Number.isFinite(latitude) &&
			Number.isFinite(longitude)
			? {latitude, longitude}
			: undefined
	})

	/** A coordinate as the lexicon types it: text (atproto has no floats) or a whole number */
	const as = (key: string, value: number) =>
		node.properties?.[key]?.type === 'integer'
			? Math.round(value)
			: String(Number(value.toFixed(6)))

	function set(place: {latitude: number; longitude: number; name?: string}) {
		object[fields.latitude] = as(fields.latitude, place.latitude)
		object[fields.longitude] = as(fields.longitude, place.longitude)
		if (fields.name && place.name && !object[fields.name]) object[fields.name] = place.name
		results = []
	}

	async function here() {
		busy = true
		failed = undefined
		try {
			set(await locate())
		} catch {
			failed = m.place_locate_failed()
		} finally {
			busy = false
		}
	}

	async function search() {
		if (!query.trim()) return
		busy = true
		failed = undefined
		try {
			results = await searchPlaces(query.trim(), getLocale())
			if (!results.length) failed = m.place_none()
		} finally {
			busy = false
		}
	}
</script>

<enform-place-field busy={busy || undefined}>
	<menu>
		<li><button type="button" onclick={here} disabled={busy}>{m.place_here()}</button></li>
	</menu>
	<!-- Inside the record's form: a search group, not a form of its own -->
	<enform-place-search role="search">
		<label>
			{m.place_search()}
			<input
				type="search"
				bind:value={query}
				enterkeyhint="search"
				autocomplete="street-address"
				onkeydown={(event) => {
					if (event.key === 'Enter') {
						event.preventDefault()
						search()
					}
				}}
			/>
		</label>
		<button type="button" onclick={search} disabled={busy}>{m.place_find()}</button>
	</enform-place-search>
	{#if results.length}
		<ul>
			{#each results as place (place.name)}
				<li><button type="button" onclick={() => set(place)}>{place.name}</button></li>
			{/each}
		</ul>
	{/if}
	{#if failed}<p role="alert">{failed}</p>{/if}
	<MapPicker {point} onpick={set} />
</enform-place-field>
