/** Following `ref` and union references between lexicon definitions */
import type {LexNode} from './types'
import {resolveLexicon} from './resolve'

/** Split a reference into its lexicon NSID and def name, relative to the lexicon it is in */
export function parseRef(ref: string, base: string): {nsid: string; def: string} {
	const [nsid, def] = ref.split('#')
	return {nsid: nsid || base, def: def || 'main'}
}

/** The definition a ref points to, with the NSID of the lexicon it lives in */
export async function resolveRef(
	ref: string,
	base: string
): Promise<{node: LexNode; nsid: string} | undefined> {
	const {nsid, def} = parseRef(ref, base)
	const doc = await resolveLexicon(nsid).catch(() => undefined)
	const node = doc?.defs[def]
	return node ? {node, nsid} : undefined
}

/** A union member's ref matching a value's $type, if the union lists it */
export function unionMember(node: LexNode, $type: unknown, base: string): string | undefined {
	if (typeof $type !== 'string') return undefined
	const target = parseRef($type, base)
	return node.refs?.find((ref) => {
		const member = parseRef(ref, base)
		return member.nsid === target.nsid && member.def === target.def
	})
}
