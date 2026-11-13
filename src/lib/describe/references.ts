/**
 * What a reference points at. A lexicon can't say it: a strongRef or an at:// URI may
 * name any record (the Lexicon language has no way to name its collection), so an
 * RSVP's `subject` is "a record" to it, and "The event" only in its description. So it
 * is inferred, and said why, as every description is: from the records (the
 * collections their references do name), else from the field's description or name
 * naming one of its app's types, else from the app (one other type there to point at).
 * A guess: the field still takes any record.
 */
import {AtUri} from '@atproto/syntax'
import type {LexiconDoc} from '#lib/lexicons/types'
import {namespaceOf} from '#lib/apps/names'
import {fieldsFromLexicon} from './fields'

/** Why a target was inferred: records point there, the field says it, the app has one */
export type TargetReason = 'records' | 'described' | 'app'

export type Reference = {
	/** The record's field that points at a record */
	field: string
	/** The types it points at, the likeliest first; none when nothing tells */
	targets: string[]
	because?: TargetReason
}

/** A type of the same app, to point at */
export type Pointable = {nsid: string; lexicon?: LexiconDoc}

/** The last segment of an NSID, as words would name it: calendar.event → event */
const nameOf = (nsid: string) => nsid.split('.').at(-1)?.toLowerCase() ?? nsid

/** The collection a reference names: a strongRef's URI, or an at:// URI */
function collectionOf(value: unknown): string | undefined {
	const uri =
		typeof value === 'string'
			? value
			: value && typeof value === 'object' && 'uri' in value
				? (value as {uri: unknown}).uri
				: undefined
	if (typeof uri !== 'string' || !uri.startsWith('at://')) return undefined
	try {
		return new AtUri(uri).collection || undefined
	} catch {
		return undefined
	}
}

/** The collections a field's values name, the most named first */
function named(samples: Record<string, unknown>[], field: string): string[] {
	const counts = new Map<string, number>()
	for (const sample of samples) {
		const collection = collectionOf(sample[field])
		if (collection) counts.set(collection, (counts.get(collection) ?? 0) + 1)
	}
	return [...counts].sort((a, b) => b[1] - a[1]).map(([collection]) => collection)
}

/** Whether a type is a profile (one per account) or points at records itself */
const isProfile = (type: Pointable) => type.lexicon?.defs.main?.key === 'literal:self'
const points = (type: Pointable) =>
	!!type.lexicon && fieldsFromLexicon(type.lexicon).some((f) => f.points?.includes('record'))

/**
 * Where each of a type's references points: `types` are its app's types (it may be
 * among them), `samples` records of it, when some were read
 */
export function referencesOf(
	nsid: string,
	lexicon: LexiconDoc | undefined,
	types: Pointable[],
	samples: Record<string, unknown>[] = []
): Reference[] {
	if (!lexicon) return []
	const properties = lexicon.defs.main?.record?.properties ?? {}
	const own = types.filter((type) => namespaceOf(type.nsid) === namespaceOf(nsid))
	return fieldsFromLexicon(lexicon)
		.filter((field) => field.points?.includes('record') && field.type !== 'union')
		.map((field): Reference => {
			const seen = named(samples, field.name)
			if (seen.length) return {field: field.name, targets: seen, because: 'records'}
			// "The event", or a field called `event`: a type of its app by that name
			const words = `${field.name} ${properties[field.name]?.description ?? ''}`
				.toLowerCase()
				.split(/[^a-z0-9]+/)
			const described = own.filter((type) => words.includes(nameOf(type.nsid)))
			if (described.length)
				return {field: field.name, targets: described.map((t) => t.nsid), because: 'described'}
			// One other type in the app, that isn't a profile and doesn't point itself
			const others = own.filter((type) => type.nsid !== nsid && !isProfile(type) && !points(type))
			if (others.length === 1) return {field: field.name, targets: [others[0].nsid], because: 'app'}
			return {field: field.name, targets: []}
		})
}

/** A type whose records answer a record of another type: an RSVP to an event */
export type Answer = {nsid: string; field: string; because: TargetReason}

/** The types of `types` with a reference inferred to point at `target` */
export function answersTo(target: string, types: Pointable[]): Answer[] {
	return types.flatMap((type) =>
		referencesOf(type.nsid, type.lexicon, types)
			.filter((reference) => reference.targets[0] === target && reference.because)
			.map((reference) => ({
				nsid: type.nsid,
				field: reference.field,
				because: reference.because as TargetReason
			}))
	)
}
