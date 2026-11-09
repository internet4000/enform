/**
 * What one can do with a record, from what it holds and what its lexicon says it is, for
 * any app: play its media, view its images, see its place, read its text (each in the
 * reader, with the list it is in), or go to what it points at (the account followed, the
 * post liked, any record it names). No app or type is named here.
 */
import {AtUri} from '@atproto/syntax'
import type {LexiconDoc} from '#lib/lexicons/types'
import {capabilitiesOf, plays} from '#lib/capabilities/detect'
import {kindOf} from '#lib/records/kinds'

/** In the reader: play, view, map, read; elsewhere: go to an account or a record */
export type RecordAction =
	| {verb: 'play' | 'view' | 'map' | 'read'}
	| {verb: 'account'; did: string; field: string}
	| {verb: 'record'; uri: string; collection: string; field: string}

const isDid = (value: unknown): value is string =>
	typeof value === 'string' && value.startsWith('did:')

function collectionOf(uri: string): string | undefined {
	try {
		return new AtUri(uri).collection || undefined
	} catch {
		return undefined
	}
}

/** What a record points at: by its lexicon's fields (a DID, an at:// URI, a strongRef) */
function targets(value: Record<string, unknown>, lexicon?: LexiconDoc): RecordAction[] {
	const properties = lexicon?.defs.main?.record?.properties ?? {}
	const subject = kindOf(lexicon).fields.subject
	const keys = [...(subject ? [subject] : []), ...Object.keys(properties)]
	const found: RecordAction[] = []
	for (const key of new Set(keys)) {
		const node = properties[key]
		const field = value[key]
		if (node?.type === 'string' && node.format === 'did' && isDid(field))
			found.push({verb: 'account', did: field, field: key})
		const uri =
			node?.type === 'string' && node.format === 'at-uri'
				? field
				: node?.type === 'ref' && typeof field === 'object' && field && 'uri' in field
					? (field as {uri: unknown}).uri
					: undefined
		const collection = typeof uri === 'string' ? collectionOf(uri) : undefined
		if (typeof uri === 'string' && collection)
			found.push({verb: 'record', uri, collection, field: key})
	}
	return found
}

/** A record's actions, the most telling first */
export function recordActions(
	value: Record<string, unknown>,
	lexicon?: LexiconDoc
): RecordAction[] {
	const capabilities = capabilitiesOf(value, lexicon)
	const has = (kind: string) => capabilities.some((capability) => capability.kind === kind)
	return [
		...(plays(capabilities) ? [{verb: 'play' as const}] : []),
		...(has('images') ? [{verb: 'view' as const}] : []),
		...(has('place') ? [{verb: 'map' as const}] : []),
		...(has('text') && !plays(capabilities) ? [{verb: 'read' as const}] : []),
		...targets(value, lexicon)
	]
}

/** Whether an action happens in the reader (else it goes somewhere) */
export const inReader = (action: RecordAction) =>
	action.verb === 'play' ||
	action.verb === 'view' ||
	action.verb === 'map' ||
	action.verb === 'read'
