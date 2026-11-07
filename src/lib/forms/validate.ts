/**
 * Full validation of a record with @atproto/lexicon, against its lexicon and every
 * lexicon it refers to (resolved transitively, from the defs the record can reach).
 */
import {Lexicons, jsonToLex, type LexiconDoc as AtprotoLexiconDoc} from '@atproto/lexicon'
import {parseRef} from '#lib/lexicons/refs'
import {resolveLexicon} from '#lib/lexicons/resolve'
import type {LexNode, LexiconDoc} from '#lib/lexicons/types'

/** Every ref a node holds, however deep */
function nodeRefs(node: LexNode): string[] {
	const refs = [...(node.ref ? [node.ref] : []), ...(node.refs ?? [])]
	const children = [
		...Object.values(node.properties ?? {}),
		...(node.items ? [node.items] : []),
		...(node.record ? [node.record] : [])
	]
	return [...refs, ...children.flatMap(nodeRefs)]
}

/** A lexicon and all those its defs reach through refs; unresolvable ones are left out */
export async function lexiconClosure(
	nsid: string,
	resolve: (nsid: string) => Promise<LexiconDoc> = resolveLexicon
): Promise<LexiconDoc[]> {
	const docs = new Map<string, LexiconDoc | undefined>()
	const seen = new Set<string>()
	let queue = [{nsid, def: 'main'}]
	while (queue.length) {
		const next: typeof queue = []
		await Promise.all(
			queue.map(async ({nsid, def}) => {
				const key = `${nsid}#${def}`
				if (seen.has(key)) return
				seen.add(key)
				if (!docs.has(nsid)) docs.set(nsid, await resolve(nsid).catch(() => undefined))
				const node = docs.get(nsid)?.defs[def]
				if (node) next.push(...nodeRefs(node).map((ref) => parseRef(ref, nsid)))
			})
		)
		queue = next
	}
	return [...docs.values()].filter((doc) => doc !== undefined)
}

export type Validation = {success: true} | {success: false; error: string}

/** Whether a record value (JSON, as the form makes it) is valid as `nsid` */
export function validateRecord(lexicons: LexiconDoc[], nsid: string, value: unknown): Validation {
	try {
		const lex = new Lexicons(lexicons as AtprotoLexiconDoc[])
		lex.assertValidRecord(nsid, jsonToLex(value as never))
		return {success: true}
	} catch (err) {
		return {success: false, error: err instanceof Error ? err.message : String(err)}
	}
}
