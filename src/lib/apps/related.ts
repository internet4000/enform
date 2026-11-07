/**
 * Types of other apps that a record also fits: the same type name (the NSID's last
 * segment, e.g. "track") and fields of the same name and kind. Only a suggestion:
 * copying opens the other type's form, prefilled with the shared fields, to review.
 */
import type {LexiconDoc, LexNode} from '#lib/lexicons/types'
import type {AppType, RepoApp} from './types'

/** A field's kind, to compare across lexicons: its type, and its format for strings */
type Kind = string

function kindOf(node: LexNode): Kind {
	return node.type === 'string' && node.format ? `string:${node.format}` : node.type
}

function kindOfValue(value: unknown): Kind | undefined {
	if (typeof value === 'string') return 'string'
	if (typeof value === 'number') return 'integer'
	if (typeof value === 'boolean') return 'boolean'
	return undefined
}

/** A record type's top-level fields and their kinds, from its lexicon, else from a record */
export function fieldsOf(lexicon: LexiconDoc | undefined, value?: Record<string, unknown>) {
	const properties = lexicon?.defs.main?.record?.properties
	const fields = new Map<string, Kind>()
	if (properties) {
		for (const [name, node] of Object.entries(properties)) fields.set(name, kindOf(node))
	} else if (value) {
		for (const [name, field] of Object.entries(value)) {
			const kind = kindOfValue(field)
			if (kind && name !== '$type') fields.set(name, kind)
		}
	}
	return fields
}

/** A record's own timestamps: a copy gets its own, so they are not carried over */
const OWN = new Set(['createdAt', 'updatedAt', 'indexedAt'])

/** Fields worth carrying over: same name, compatible kind (a plain string fits any string) */
function shared(from: Map<string, Kind>, to: Map<string, Kind>): string[] {
	return [...from].flatMap(([name, kind]) => {
		const target = to.get(name)
		if (!target || OWN.has(name)) return []
		const compatible = target === kind || (kind === 'string' && target.startsWith('string'))
		return compatible ? [name] : []
	})
}

export const typeNameOf = (nsid: string) => nsid.split('.').at(-1)?.toLowerCase() ?? nsid

export type Related = {app: RepoApp; type: AppType; fields: string[]}

/** The apps' types a record of `nsid` also fits, most shared fields first */
export function relatedTypes(
	nsid: string,
	lexicon: LexiconDoc | undefined,
	value: Record<string, unknown> | undefined,
	apps: RepoApp[]
): Related[] {
	const from = fieldsOf(lexicon, value)
	const name = typeNameOf(nsid)
	return apps
		.flatMap((app) =>
			[...(app.profile ? [app.profile] : []), ...app.lists, ...app.singles].map((type) => ({
				app,
				type
			}))
		)
		.filter(({type}) => type.nsid !== nsid && type.lexicon && typeNameOf(type.nsid) === name)
		.map(({app, type}) => ({app, type, fields: shared(from, fieldsOf(type.lexicon))}))
		.filter((related) => related.fields.length > 0)
		.sort((a, b) => b.fields.length - a.fields.length)
}

/** The shared fields' values of a record, to prefill the other type's form */
export function carried(value: Record<string, unknown>, fields: string[]) {
	return Object.fromEntries(
		fields.filter((name) => name in value).map((name) => [name, value[name]])
	)
}
