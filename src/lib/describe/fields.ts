/**
 * A record type's fields, as the description engine reads them: from its lexicon when
 * it is published, else from sample records (what their values look like). The same
 * rules then describe both (docs/architecture.md › Where it is going).
 */
import type {LexiconDoc, LexNode} from '#lib/lexicons/types'

export type Field = {
	name: string
	type: 'string' | 'integer' | 'boolean' | 'blob' | 'ref' | 'array' | 'object' | 'other'
	/** A string's format: datetime, uri, at-uri, did… (inferred from values without a lexicon) */
	format?: string
	/** A blob's media types */
	accept?: string[]
	/** A ref's target (com.atproto.repo.strongRef…) */
	ref?: string
	/** A short value of its own: an emoji, a choice among known values */
	short?: boolean
}

/** Where the fields come from: a lexicon is certain; records only show what they have */
export type FieldSource = 'lexicon' | 'records' | 'none'

const SHORT = 64

/** The fields of a lexicon's record, in its order */
export function fieldsFromLexicon(doc: LexiconDoc): Field[] {
	const properties = doc.defs.main?.record?.properties ?? {}
	return Object.entries(properties).map(([name, node]) => fromNode(name, node))
}

function fromNode(name: string, node: LexNode): Field {
	const type = (['string', 'integer', 'boolean', 'blob', 'ref', 'array', 'object'] as const).find(
		(known) => known === node.type
	)
	return {
		name,
		type: type ?? 'other',
		format: node.format,
		accept: node.accept,
		ref: node.ref,
		short:
			node.type === 'string' &&
			((node.maxGraphemes ?? node.maxLength ?? Infinity) <= SHORT ||
				!!node.knownValues ||
				!!node.enum)
	}
}

const DATETIME = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}/
const WEB = /^https?:\/\/\S+$/

/** A string's format, from what it looks like */
function formatOf(value: string): string | undefined {
	if (DATETIME.test(value) && !Number.isNaN(Date.parse(value))) return 'datetime'
	if (value.startsWith('at://')) return 'at-uri'
	if (/^did:[a-z]+:\S+$/.test(value)) return 'did'
	if (WEB.test(value)) return 'uri'
	return undefined
}

function fromValue(name: string, values: unknown[]): Field {
	const present = values.filter((value) => value !== undefined && value !== null)
	const first = present[0]
	if (typeof first === 'string') {
		const strings = present.filter((value): value is string => typeof value === 'string')
		const formats = new Set(strings.map(formatOf))
		const format = formats.size === 1 ? [...formats][0] : undefined
		// Short only when every sample is (an emoji, a word), not a title that happens to be
		const short = !format && strings.every((value) => [...value].length <= 16)
		return {name, type: 'string', format, short}
	}
	if (typeof first === 'number') return {name, type: 'integer'}
	if (typeof first === 'boolean') return {name, type: 'boolean'}
	if (Array.isArray(first)) return {name, type: 'array'}
	if (first && typeof first === 'object') {
		const object = first as Record<string, unknown>
		if (object.$type === 'blob') {
			const types = present.map((value) => (value as {mimeType?: string}).mimeType)
			return {name, type: 'blob', accept: [...new Set(types.filter((t) => !!t))] as string[]}
		}
		if (typeof object.uri === 'string' && typeof object.cid === 'string') {
			return {name, type: 'ref', ref: 'com.atproto.repo.strongRef'}
		}
		return {name, type: 'object'}
	}
	return {name, type: 'other'}
}

/** The fields sample records show, in the order they first appear */
export function fieldsFromRecords(values: Record<string, unknown>[]): Field[] {
	const names = [...new Set(values.flatMap((value) => Object.keys(value)))].filter(
		(name) => name !== '$type'
	)
	return names.map((name) =>
		fromValue(
			name,
			values.map((value) => value[name])
		)
	)
}
