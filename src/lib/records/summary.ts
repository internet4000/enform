/** A one-line summary of a record for lists, from its lexicon when known */
import type {LexNode} from '#lib/lexicons/types'

/** Property names that usually say what a record is, most telling first */
export const TITLE_KEYS = ['title', 'name', 'displayName', 'text', 'description', 'url', 'subject']

/** A timestamp isn't what a record is about */
const TIMESTAMP = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}/

function text(value: unknown): string | undefined {
	if (typeof value === 'string' && value.trim() && !TIMESTAMP.test(value)) return value.trim()
	if (value && typeof value === 'object' && 'uri' in value) return text(value.uri)
	return undefined
}

export function recordSummary(
	value: Record<string, unknown>,
	record?: LexNode
): string | undefined {
	for (const key of TITLE_KEYS) {
		const found = text(value[key])
		if (found) return found
	}
	// Else the first string property, in the lexicon's order when there is one
	const keys = Object.keys(record?.properties ?? value)
	for (const key of keys) {
		if (key === '$type') continue
		const node = record?.properties?.[key]
		if (node && node.type !== 'string') continue
		if (node?.format === 'datetime') continue
		const found = text(value[key])
		if (found) return found
	}
	return undefined
}

/** When the record says it was made, if it does */
export function recordDate(value: Record<string, unknown>): string | undefined {
	const date = value.createdAt ?? value.indexedAt
	return typeof date === 'string' && !Number.isNaN(Date.parse(date)) ? date : undefined
}
