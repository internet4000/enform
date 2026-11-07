/**
 * Every app of the atmosphere, discovered through the protocol: the relay lists the
 * repos holding com.atproto.lexicon.schema records, and each repo's schemas say which
 * namespaces it publishes. A namespace counts only when its authority's `_lexicon`
 * DNS record names that repo, as lexicon resolution requires: anyone can write schema
 * records, only a domain's owner publishes its lexicons.
 */
import {NSID} from '@atproto/syntax'
import app from '#lib/config/app.json' with {type: 'json'}
import {txtDids} from '#lib/atproto/dns'
import {xrpcGet} from '#lib/atproto/xrpc'
import {schemasOf} from '#lib/lexicons/catalog'
import {SCHEMA_COLLECTION} from '#lib/lexicons/resolve'
import {appOf, namespaceOf} from './names'

let publishers: Promise<string[]> | undefined

/** The DIDs of every repo publishing lexicons, as the relay knows them */
export function lexiconPublishers(): Promise<string[]> {
	publishers ??= (async () => {
		const dids: string[] = []
		let cursor: string | undefined
		do {
			const page = await xrpcGet<{repos: {did: string}[]; cursor?: string}>(
				app.services.relay,
				'com.atproto.sync.listReposByCollection',
				{collection: SCHEMA_COLLECTION, limit: 2000, cursor}
			)
			dids.push(...page.repos.map((repo) => repo.did))
			cursor = page.repos.length ? page.cursor : undefined
		} while (cursor)
		return dids
	})()
	publishers.catch(() => (publishers = undefined))
	return publishers
}

export type DiscoveredApp = {namespace: string; domain: string; types: string[]}

/** Whether `_lexicon.<authority>` names this repo */
async function publishes(did: string, authority: string): Promise<boolean> {
	return (await txtDids(`_lexicon.${authority}`).catch((): string[] => [])).includes(did)
}

/** The apps (namespaces with record types) a repo truly publishes */
export async function appsOf(did: string): Promise<DiscoveredApp[]> {
	const docs = await schemasOf(did).catch(() => [])
	const byNamespace = new Map<string, {authorities: Set<string>; types: string[]}>()
	for (const doc of docs) {
		if (!NSID.isValid(doc.id)) continue
		const namespace = namespaceOf(doc.id)
		const entry = byNamespace.get(namespace) ?? {
			authorities: new Set<string>(),
			types: [] as string[]
		}
		entry.authorities.add(NSID.parse(doc.id).authority)
		if (doc.defs.main?.type === 'record') entry.types.push(doc.id)
		byNamespace.set(namespace, entry)
	}
	const apps = await Promise.all(
		[...byNamespace].map(async ([namespace, {authorities, types}]) => {
			if (!types.length) return undefined
			const checks = await Promise.all(
				[...authorities].map((authority) => publishes(did, authority))
			)
			if (!checks.some(Boolean)) return undefined
			return {namespace, domain: appOf(`${namespace}.x`), types: types.sort()}
		})
	)
	return apps.filter((found): found is DiscoveredApp => !!found)
}
