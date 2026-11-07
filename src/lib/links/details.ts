/**
 * What a web link is: its title, description, image and site, to preview it and help
 * fill a form. Media links (YouTube, SoundCloud, Vimeo, Spotify, Discogs, audio and
 * video files) through media-now; any other page through a link card service
 * (config/app.json services.linkCards). The pasted address goes to those services.
 */
import {getMedia, parseUrl} from 'media-now'
import app from '#lib/config/app.json' with {type: 'json'}

export type LinkDetails = {
	url: string
	title?: string
	description?: string
	image?: string
	site: string
	/** A playable media (a track, a video) rather than a page */
	media: boolean
}

export function isWebLink(value: unknown): value is string {
	if (typeof value !== 'string' || !/^https?:\/\/\S+\.\S+/.test(value)) return false
	try {
		new URL(value)
		return true
	} catch {
		return false
	}
}

const text = (value: unknown) =>
	typeof value === 'string' && value.trim() ? value.trim() : undefined

async function fromMedia(url: string): Promise<LinkDetails | undefined> {
	if (!parseUrl(url)) return undefined
	const media = (await getMedia(url).catch(() => undefined)) as
		(Record<string, unknown> & {title?: string}) | undefined
	if (!media) return undefined
	return {
		url,
		title: text(media.title),
		description: text(media.author),
		image: text(media.thumbnail),
		site: String(media.provider),
		media: true
	}
}

async function fromCard(url: string): Promise<LinkDetails | undefined> {
	const endpoint = new URL(app.services.linkCards)
	endpoint.searchParams.set('url', url)
	const res = await fetch(endpoint, {signal: AbortSignal.timeout(app.reads.timeoutMs)})
	if (!res.ok) return undefined
	const card = (await res.json()) as Record<string, unknown>
	if (text(card.error)) return undefined
	return {
		url,
		title: text(card.title),
		description: text(card.description),
		image: text(card.image),
		site: new URL(url).hostname.replace(/^www\./, ''),
		media: false
	}
}

const cache = new Map<string, Promise<LinkDetails | undefined>>()

export function linkDetails(url: string): Promise<LinkDetails | undefined> {
	let details = cache.get(url)
	if (!details) {
		details = fromMedia(url)
			.then((media) => media ?? fromCard(url))
			.catch(() => undefined)
		cache.set(url, details)
	}
	return details
}
