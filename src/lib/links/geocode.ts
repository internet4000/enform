/**
 * Places by address, through a geocoder (config/app.json services.geocoder, Nominatim
 * by default): what's typed is sent to it. Few requests: only on submit, never per key.
 */
import app from '#lib/config/app.json' with {type: 'json'}

export type Place = {name: string; latitude: number; longitude: number}

export async function searchPlaces(query: string, language: string): Promise<Place[]> {
	const url = new URL(app.services.geocoder)
	url.searchParams.set('q', query)
	url.searchParams.set('format', 'jsonv2')
	url.searchParams.set('limit', '5')
	url.searchParams.set('accept-language', language)
	const res = await fetch(url, {signal: AbortSignal.timeout(app.reads.timeoutMs)})
	if (!res.ok) return []
	const results = (await res.json()) as {display_name: string; lat: string; lon: string}[]
	return results.map((result) => ({
		name: result.display_name,
		latitude: Number(result.lat),
		longitude: Number(result.lon)
	}))
}

/** Where this device is, if its person allows it */
export function locate(): Promise<{latitude: number; longitude: number}> {
	return new Promise((resolve, reject) =>
		navigator.geolocation.getCurrentPosition(
			(position) =>
				resolve({latitude: position.coords.latitude, longitude: position.coords.longitude}),
			reject,
			{enableHighAccuracy: true, timeout: app.reads.timeoutMs}
		)
	)
}
