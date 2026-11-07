/**
 * A repo seen app by app: each NSID authority's collections, with its profiles
 * (one record per account) apart from its lists, as their lexicons say.
 */
import type {Identity} from './atproto/identity'
import {getRecord, type RepoRecord} from './atproto/repo'
import {groupByApp} from './collections'
import {collectionKind, profileKey, type CollectionKind} from './lexicons/kind'
import {resolveLexicon} from './lexicons/resolve'
import type {LexiconDoc} from './lexicons/types'

export type AppCollection = {nsid: string; kind: CollectionKind; lexicon?: LexiconDoc}
export type AppProfile = AppCollection & {rkey: string; record: RepoRecord}
export type RepoApp = {app: string; profiles: AppProfile[]; collections: AppCollection[]}

async function describe(nsid: string): Promise<AppCollection> {
	const lexicon = await resolveLexicon(nsid).catch(() => undefined)
	return {nsid, kind: collectionKind(lexicon), lexicon}
}

async function withProfile(repo: Identity, collection: AppCollection) {
	const rkey = collection.lexicon && profileKey(collection.lexicon)
	if (collection.kind !== 'profile' || !rkey) return collection
	const record = await getRecord(repo, collection.nsid, rkey).catch(() => undefined)
	return record ? {...collection, rkey, record} : collection
}

export async function repoApps(repo: Identity, collections: string[]): Promise<RepoApp[]> {
	return Promise.all(
		groupByApp(collections).map(async (group) => {
			const described = await Promise.all(
				group.collections.map(async (nsid) => withProfile(repo, await describe(nsid)))
			)
			return {
				app: group.app,
				profiles: described.filter((c): c is AppProfile => 'record' in c),
				collections: described.filter((c) => !('record' in c))
			}
		})
	)
}
