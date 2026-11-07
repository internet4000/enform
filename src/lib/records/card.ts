/**
 * A record as a card: a title, a text and images, picked from the properties
 * whose names and lexicon types usually carry them.
 */
import type {LexNode} from '#lib/lexicons/types'
import {recordSummary} from './summary'

export type BlobRef = {$type: 'blob'; ref: {$link: string}; mimeType: string}

export type Card = {title?: string; text?: string; avatar?: string; banner?: string}

const TEXT_KEYS = ['description', 'bio', 'about', 'summary', 'text']
const AVATAR_KEYS = ['avatar', 'image', 'icon', 'logo', 'picture', 'photo']
const BANNER_KEYS = ['banner', 'cover', 'header']

function imageCid(value: unknown): string | undefined {
	const blob = value as BlobRef | undefined
	return blob?.$type === 'blob' && blob.mimeType?.startsWith('image/') ? blob.ref?.$link : undefined
}

function firstString(value: Record<string, unknown>, keys: string[], skip?: string) {
	for (const key of keys) {
		const found = value[key]
		if (typeof found === 'string' && found.trim() && found !== skip) return found.trim()
	}
	return undefined
}

export function recordCard(value: Record<string, unknown>, record?: LexNode): Card {
	const title = recordSummary(value, record)
	const avatarKey = AVATAR_KEYS.find((key) => imageCid(value[key]))
	const bannerKey = BANNER_KEYS.find((key) => imageCid(value[key]))
	// Else the first image anywhere at the top level
	const anyImage = Object.values(value).map(imageCid).find(Boolean)
	return {
		title,
		text: firstString(value, TEXT_KEYS, title),
		avatar: avatarKey ? imageCid(value[avatarKey]) : bannerKey ? undefined : anyImage,
		banner: bannerKey ? imageCid(value[bannerKey]) : undefined
	}
}
