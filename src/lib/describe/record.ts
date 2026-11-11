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
