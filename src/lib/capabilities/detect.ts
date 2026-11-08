/**
 * What a record can do, found in its data: media to play, images to show, a place, text
 * to read, a link. Generic detectors, by data shape only: they know no app or type, so a
 * Bluesky post with a video plays like a Radio4000 track (docs/architecture.md).
 */
import {parseUrl} from 'media-now'
import type {LexiconDoc} from '#lib/lexicons/types'
import {kindOf} from '#lib/records/kinds'

/** Media players enform can embed, by media-now's provider names */
export const PLAYABLE = ['youtube', 'vimeo', 'spotify', 'soundcloud'] as const
export type Player = (typeof PLAYABLE)[number] | 'audio' | 'video'

export type Capability =
	| {kind: 'media'; url: string; player: Player}
	| {kind: 'blob-media'; cid: string; player: 'audio' | 'video'}
	| {kind: 'images'; cids: string[]; alts: string[]}
	| {kind: 'place'; latitude: number; longitude: number; name?: string}
	| {kind: 'text'; text: string}
	| {kind: 'link'; url: string}

type Blob = {$type: 'blob'; ref: {$link: string}; mimeType: string}

const isBlob = (value: unknown): value is Blob =>
	typeof value === 'object' &&
	value !== null &&
	(value as Blob).$type === 'blob' &&
	typeof (value as Blob).ref?.$link === 'string'

const isWebLink = (value: unknown): value is string =>
	typeof value === 'string' && /^https?:\/\/\S+\.\S+/.test(value)

/** Every value in a record, with the object holding it, a few levels deep */
function* walk(
	value: unknown,
	depth = 6,
	parent?: Record<string, unknown>
): Generator<[unknown, Record<string, unknown> | undefined]> {
	yield [value, parent]
	if (depth === 0 || typeof value !== 'object' || value === null) return
	const object = value as Record<string, unknown>
	for (const child of Array.isArray(value) ? value : Object.values(object)) {
		yield* walk(child, depth - 1, Array.isArray(value) ? parent : object)
	}
}

function playable(url: string): Player | undefined {
	const parsed = parseUrl(url)
	if (!parsed) return undefined
	if ((PLAYABLE as readonly string[]).includes(parsed.provider)) return parsed.provider as Player
	if (parsed.provider === 'file' && (parsed.kind === 'audio' || parsed.kind === 'video')) {
		return parsed.kind
	}
	return undefined
}

const number = (value: unknown) => {
	const parsed = typeof value === 'number' ? value : Number.parseFloat(String(value))
	return Number.isFinite(parsed) ? parsed : undefined
}

/** A place: an object with a latitude and a longitude (or lat and lon/lng) */
function place(object: Record<string, unknown>): Capability | undefined {
	const latitude = number(object.latitude ?? object.lat)
	const longitude = number(object.longitude ?? object.lon ?? object.lng)
	if (latitude === undefined || longitude === undefined) return undefined
	if (Math.abs(latitude) > 90 || Math.abs(longitude) > 180) return undefined
	const name = typeof object.name === 'string' ? object.name : undefined
	return {kind: 'place', latitude, longitude, name}
}

/** What a record can do, the most telling first: media, images, place, text, link */
export function capabilitiesOf(value: Record<string, unknown>, lexicon?: LexiconDoc): Capability[] {
	const media: Capability[] = []
	const links: Capability[] = []
	const images: string[] = []
	const alts: string[] = []
	let found: Capability | undefined
	for (const [item, parent] of walk(value)) {
		if (isWebLink(item)) {
			const player = playable(item)
			if (player) media.push({kind: 'media', url: item, player})
			else links.push({kind: 'link', url: item})
		} else if (isBlob(item)) {
			const type = item.mimeType ?? ''
			if (type.startsWith('image/')) {
				images.push(item.ref.$link)
				alts.push(typeof parent?.alt === 'string' ? parent.alt : '')
			} else if (type.startsWith('audio/') || type.startsWith('video/')) {
				media.push({
					kind: 'blob-media',
					cid: item.ref.$link,
					player: type.startsWith('audio/') ? 'audio' : 'video'
				})
			}
		} else if (!found && typeof item === 'object' && item !== null && !Array.isArray(item)) {
			found = place(item as Record<string, unknown>)
		}
	}
	const textField = kindOf(lexicon).fields.text
	const text = textField ? value[textField] : value.text
	return [
		...media,
		...(images.length ? [{kind: 'images' as const, cids: images, alts}] : []),
		...(found ? [found] : []),
		...(typeof text === 'string' && text.trim() ? [{kind: 'text' as const, text}] : []),
		...links
	]
}

/** Whether a record plays (media), so a reader can go on when it ends */
export const plays = (capabilities: Capability[]) =>
	capabilities.some((capability) => capability.kind === 'media' || capability.kind === 'blob-media')
