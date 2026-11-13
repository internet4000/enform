/**
 * What one record is, as views show it: from its type's description (describeType),
 * read on the record itself. Its title first: the field its type names it by, its key
 * when that is what names it (a repo's slug, a lexicon's NSID), else its summary.
 */
import type {LexiconDoc} from '#lib/lexicons/types'
import {recordSummary} from '#lib/records/summary'
import {describeType, type TypeDescription} from './type'

export type RecordDescription = {
	/** What to call it: undefined when nothing says (views fall back to its type) */
	title?: string
}

/**
 * A part of a record its kind doesn't show (a recipe's ingredients, its steps), shown by
 * its shape: words, a list (numbered when its items are long, as steps are), a link, a
 * date, or a fact (a number, a yes or no, a short value)
 */
export type Part =
	| {field: string; as: 'text' | 'link' | 'date' | 'fact'; value: string}
	| {field: string; as: 'list'; items: string[]; ordered: boolean}

/** When a record was made or changed: its own, not what it's about */
const STAMPS = new Set(['createdAt', 'updatedAt', 'indexedAt', 'created_at', 'updated_at'])
/** An item longer than a word or two, or of several lines: a step, not an ingredient */
const LONG_ITEM = 64

/** Its other content, in its lexicon's order: what no role of its type shows */
export function recordRest(value: Record<string, unknown>, lexicon?: LexiconDoc): Part[] {
	const type = lexicon ? typeOf(lexicon) : describeType('', {samples: [{rkey: '', value}]})
	const shown = new Set<string>(Object.values(type.roles).filter((role) => !!role))
	return type.fields.flatMap((field): Part[] => {
		const found = value[field.name]
		if (shown.has(field.name) || STAMPS.has(field.name) || field.points?.length) return []
		if (typeof found === 'string' && found.trim()) {
			if (field.format === 'uri' || /^https?:\/\//.test(found))
				return [{field: field.name, as: 'link', value: found}]
			if (field.format === 'datetime') return [{field: field.name, as: 'date', value: found}]
			if (field.format) return []
			const fact = field.short && !found.includes('\n')
			return [{field: field.name, as: fact ? 'fact' : 'text', value: found}]
		}
		if (typeof found === 'number' || typeof found === 'boolean')
			return [{field: field.name, as: 'fact', value: String(found)}]
		if (Array.isArray(found)) {
			const items = found.filter(
				(item): item is string => typeof item === 'string' && !!item.trim()
			)
			if (!items.length || items.length !== found.length) return []
			const ordered = items.some((item) => item.length > LONG_ITEM || item.includes('\n'))
			return [{field: field.name, as: 'list', items, ordered}]
		}
		return []
	})
}

const described = new WeakMap<LexiconDoc, TypeDescription>()

/** A lexicon's description, once per lexicon */
export function typeOf(lexicon: LexiconDoc): TypeDescription {
	let type = described.get(lexicon)
	if (!type) {
		type = describeType(lexicon.id, {lexicon})
		described.set(lexicon, type)
	}
	return type
}

export function describeRecord(
	record: {rkey: string; value: Record<string, unknown>},
	lexicon?: LexiconDoc
): RecordDescription {
	const type = lexicon ? typeOf(lexicon) : undefined
	if (type?.roles.title === '$key') return {title: record.rkey}
	return {title: recordSummary(record.value, lexicon?.defs.main?.record)}
}
