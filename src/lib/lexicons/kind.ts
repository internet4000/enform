/**
 * What a collection is, from its lexicon's record key type
 * (https://atproto.com/specs/record-key): one record per account (a profile), many
 * over time (a list), or records keyed by something else (a set).
 */
import type {LexiconDoc} from './types'

export type CollectionKind = 'profile' | 'list' | 'set'

export function collectionKind(doc: LexiconDoc | undefined): CollectionKind {
	const key = doc?.defs.main?.type === 'record' ? doc.defs.main.key : undefined
	if (key?.startsWith('literal:')) return 'profile'
	if (key === 'tid') return 'list'
	return 'set'
}

/** A profile's only record key, e.g. `self` for `literal:self` */
export function profileKey(doc: LexiconDoc): string | undefined {
	const key = doc.defs.main?.key
	return key?.startsWith('literal:') ? key.slice('literal:'.length) : undefined
}
