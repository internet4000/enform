/**
 * The order an object's fields are asked in. Lexicon JSON doesn't keep property order
 * (records are stored as DAG-CBOR, which sorts keys), so it is derived: required fields
 * as the lexicon lists them, then optional ones by what they say, timestamps that fill
 * themselves last, and deprecated fields apart.
 */
import type {LexNode} from '#lib/lexicons/types'
import {TITLE_KEYS} from '#lib/records/summary'

/** Fields to ask, timestamps a record keeps of itself (asked apart), deprecated ones */
export type FieldOrder = {fields: string[]; automatic: string[]; deprecated: string[]}

/** A record's own timestamps: they fill themselves (now), so they are asked apart */
const AUTOMATIC = ['createdAt', 'updatedAt', 'indexedAt']

export function isDeprecated(node: LexNode): boolean {
	return /^\s*deprecated\b/i.test(node.description ?? '')
}

function isDatetime(node: LexNode): boolean {
	return node.type === 'string' && node.format === 'datetime'
}

/** Simple fields first, nested structures after */
function group(node: LexNode): number {
	const groups: Record<string, number> = {string: 0, integer: 1, boolean: 1, blob: 2, array: 3}
	return groups[node.type] ?? 4
}

function prominence(key: string): number {
	const index = TITLE_KEYS.indexOf(key)
	return index === -1 ? TITLE_KEYS.length : index
}

export function fieldOrder(node: LexNode): FieldOrder {
	const properties = node.properties ?? {}
	const keys = Object.keys(properties)
	const required = (node.required ?? []).filter((key) => key in properties)
	const deprecated = keys.filter((key) => isDeprecated(properties[key]))
	const live = (key: string) => !deprecated.includes(key)
	const first = required.filter((key) => live(key) && !isDatetime(properties[key]))
	const optional = keys
		.filter((key) => live(key) && !required.includes(key) && !isDatetime(properties[key]))
		.sort(
			(a, b) =>
				prominence(a) - prominence(b) ||
				group(properties[a]) - group(properties[b]) ||
				keys.indexOf(a) - keys.indexOf(b)
		)
	const dates = [
		...required.filter((key) => live(key) && isDatetime(properties[key])),
		...keys.filter((key) => live(key) && !required.includes(key) && isDatetime(properties[key]))
	]
	const automatic = dates.filter((key) => AUTOMATIC.includes(key))
	return {
		fields: [...first, ...optional, ...dates.filter((key) => !automatic.includes(key))],
		automatic,
		deprecated
	}
}
