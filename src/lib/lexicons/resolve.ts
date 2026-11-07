/**
 * Lexicon resolution as the spec defines it: the NSID's authority (all but its last
 * segment, reversed) has a DNS TXT record `_lexicon.<authority>` naming a DID, whose
 * repo holds the schema as a com.atproto.lexicon.schema record keyed by the NSID.
 * https://atproto.com/specs/lexicon#lexicon-publication-and-resolution
 *
 * TODO: verify the record with a repo proof (com.atproto.sync.getRecord) rather than
 * trusting the PDS's getRecord answer.
 */
import {NSID} from '@atproto/syntax'
import {txtDids} from '#lib/atproto/dns'
import {didDocument, pdsEndpoint} from '#lib/atproto/did'
import {xrpcGet} from '#lib/atproto/xrpc'
import type {LexiconDoc} from './types'

export const SCHEMA_COLLECTION = 'com.atproto.lexicon.schema'

export class LexiconNotFound extends Error {
	constructor(readonly nsid: string) {
		super(`No lexicon published for ${nsid}`)
	}
}

async function fetchLexicon(nsid: string): Promise<LexiconDoc> {
	const {authority} = NSID.parse(nsid)
	const [did] = await txtDids(`_lexicon.${authority}`)
	if (!did) throw new LexiconNotFound(nsid)
	const pds = pdsEndpoint(await didDocument(did))
	const {value} = await xrpcGet<{value: LexiconDoc & {$type: string}}>(
		pds,
		'com.atproto.repo.getRecord',
		{repo: did, collection: SCHEMA_COLLECTION, rkey: nsid}
	).catch(() => {
		throw new LexiconNotFound(nsid)
	})
	if (value.id !== nsid || value.lexicon !== 1) throw new LexiconNotFound(nsid)
	const {$type: _, ...doc} = value
	return doc
}

const lexicons = new Map<string, Promise<LexiconDoc>>()

/** An NSID's published lexicon, cached for the session */
export function resolveLexicon(nsid: string): Promise<LexiconDoc> {
	let doc = lexicons.get(nsid)
	if (!doc) {
		doc = fetchLexicon(nsid)
		lexicons.set(nsid, doc)
	}
	return doc
}
