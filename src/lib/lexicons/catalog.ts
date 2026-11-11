/**
 * Every record type an app defines, as published: the lexicon authority's repo holds
 * one com.atproto.lexicon.schema record per lexicon, so listing that collection is
 * the app's catalog of types.
 */
import {NSID} from '@atproto/syntax'
import {txtDids} from '#lib/atproto/dns'
import {didDocument, pdsEndpoint} from '#lib/atproto/did'
import {xrpcGet} from '#lib/atproto/xrpc'
import {primeLexicons, SCHEMA_COLLECTION} from './resolve'
import {exampleTypes, isExample} from './examples/index'
import type {LexiconDoc} from './types'

const PAGE = 100

async function listSchemas(did: string): Promise<LexiconDoc[]> {
	const pds = pdsEndpoint(await didDocument(did))
	const docs: LexiconDoc[] = []
	let cursor: string | undefined
	do {
		const page = await xrpcGet<{records: {value: LexiconDoc}[]; cursor?: string}>(
			pds,
			'com.atproto.repo.listRecords',
			{repo: did, collection: SCHEMA_COLLECTION, limit: PAGE, cursor}
		)
		docs.push(...page.records.map((record) => record.value).filter((doc) => doc?.lexicon === 1))
		cursor = page.records.length === PAGE ? page.cursor : undefined
	} while (cursor)
	primeLexicons(docs)
	return docs
}

const catalogs = new Map<string, Promise<LexiconDoc[]>>()

/** Every lexicon a repo publishes, cached for the session */
export function schemasOf(did: string): Promise<LexiconDoc[]> {
	let docs = catalogs.get(did)
	if (!docs) {
		docs = listSchemas(did)
		docs.catch(() => catalogs.delete(did))
		catalogs.set(did, docs)
	}
	return docs
}

/** The record lexicons published alongside `seed` (an NSID of the app), in its namespace */
export async function recordTypes(seed: string, namespace: string): Promise<LexiconDoc[]> {
	if (isExample(seed)) return exampleTypes(namespace)
	const [did] = await txtDids(`_lexicon.${NSID.parse(seed).authority}`).catch(() => [])
	if (!did) return []
	return (await schemasOf(did).catch(() => [])).filter(
		(doc) => doc.id.startsWith(`${namespace}.`) && doc.defs.main?.type === 'record'
	)
}
