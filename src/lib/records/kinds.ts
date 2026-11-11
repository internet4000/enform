/**
 * What kind of thing a record type is (a profile, a post, a photo, a link, a follow, a
 * reaction, a status, an event, a list), and the fields that carry it: from the
 * description engine (src/lib/describe), for every app, with no per-app code.
 */
import type {LexiconDoc} from '#lib/lexicons/types'
import {describeType, type RecordKind} from '#lib/describe/type'

export type {RecordKind}

/** The fields that carry a kind: the ones its views and forms put first */
export type KindFields = {
	text?: string
	title?: string
	url?: string
	image?: string
	subject?: string
	start?: string
	value?: string
}

export type Kind = {kind: RecordKind; fields: KindFields}

export function kindOf(doc: LexiconDoc | undefined): Kind {
	const {kind, roles} = describeType(doc?.id ?? '', {lexicon: doc})
	const {date: _date, ...fields} = roles
	// Only the fields its kind carries, as views and forms read them
	return {kind, fields: Object.fromEntries(Object.entries(fields).filter(([, v]) => v))}
}
