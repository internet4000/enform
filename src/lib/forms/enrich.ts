/**
 * Filling a form from a link, by lexicon shape alone: when an object has a web link
 * field (format uri), its empty plain-text siblings meant for a title or a description
 * take the link's, cut to their limits. What someone typed is never replaced; what was
 * filled from a previous link is.
 */
import type {LexNode} from '#lib/lexicons/types'
import type {LinkDetails} from '#lib/links/details'
import {graphemeLength} from './text'

const TITLE = ['title', 'name', 'displayName', 'label']
const DESCRIPTION = ['description', 'summary', 'about']

/** The object's link fields: plain strings declared as URIs */
export function linkFields(node: LexNode): string[] {
	return Object.entries(node.properties ?? {})
		.filter(([, field]) => field.type === 'string' && field.format === 'uri')
		.map(([key]) => key)
}

function fits(text: string, field: LexNode): string {
	let fitted = text
	if (field.maxGraphemes !== undefined && graphemeLength(fitted) > field.maxGraphemes) {
		const graphemes = [...new Intl.Segmenter().segment(fitted)].map((s) => s.segment)
		fitted = `${graphemes.slice(0, field.maxGraphemes - 1).join('')}…`
	}
	if (field.maxLength !== undefined) {
		while (new TextEncoder().encode(fitted).length > field.maxLength)
			fitted = fitted.slice(0, -2) + '…'
	}
	return fitted
}

/**
 * The fields to set from a link's details. `filled` holds what was filled before, so
 * it can be replaced; anything else already there is someone's own and stays.
 */
export function enrichment(
	node: LexNode,
	object: Record<string, unknown>,
	details: LinkDetails,
	filled: Record<string, string>
): Record<string, string> {
	const patch: Record<string, string> = {}
	const take = (keys: string[], text: string | undefined) => {
		if (!text) return
		const key = keys.find((name) => {
			const field = node.properties?.[name]
			return field?.type === 'string' && !field.format && !field.enum && !field.knownValues
		})
		if (!key) return
		const current = object[key]
		const free = current === undefined || current === '' || current === filled[key]
		if (free) patch[key] = fits(text, node.properties![key])
	}
	take(TITLE, details.title)
	take(DESCRIPTION, details.description && !details.media ? details.description : undefined)
	return patch
}
