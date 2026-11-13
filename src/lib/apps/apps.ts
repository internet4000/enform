/**
 * A repo seen app by app. Each app's record types come from its published lexicons
 * (its catalog), so the types a repo has none of yet show too, ready to create.
 */
import type {Identity} from '#lib/atproto/identity'
import {getRecord} from '#lib/atproto/repo'
import {recordTypes} from '#lib/lexicons/catalog'
import {collectionKind, profileKey} from '#lib/lexicons/kind'
import {resolveLexicon} from '#lib/lexicons/resolve'
import type {LexiconDoc} from '#lib/lexicons/types'
import {directoryApps, directoryTypes} from './directory'
import {appOf, isProfileName, namespaceOf, typeName} from './names'
import type {AppSingle, AppType, RepoApp} from './types'

function toType(nsid: string, lexicon: LexiconDoc | undefined, used: boolean): AppType {
	return {nsid, name: typeName(nsid), kind: collectionKind(lexicon), lexicon, used}
}

async function single(repo: Identity | undefined, type: AppType): Promise<AppSingle> {
	const rkey = (type.lexicon && profileKey(type.lexicon)) ?? 'self'
	const record =
		repo && type.used ? await getRecord(repo, type.nsid, rkey).catch(() => undefined) : undefined
	return {...type, rkey, record}
}

/** An app's types: its catalog, plus any collection of the repo it doesn't list */
async function appTypes(
	seed: string,
	used: string[]
): Promise<{types: AppType[]; published: boolean}> {
	const namespace = namespaceOf(seed)
	const catalog = await recordTypes(seed, namespace)
	const listed = new Set(catalog.map((doc) => doc.id))
	const extra = await Promise.all(
		used
			.filter((nsid) => !listed.has(nsid))
			.map(async (nsid) => toType(nsid, await resolveLexicon(nsid).catch(() => undefined), true))
	)
	return {
		types: [...catalog.map((doc) => toType(doc.id, doc, used.includes(doc.id))), ...extra],
		published: catalog.length > 0
	}
}

async function buildApp(
	repo: Identity | undefined,
	seed: string,
	used: string[]
): Promise<RepoApp> {
	const {types, published} = await appTypes(seed, used)
	const singles = await Promise.all(
		types.filter((type) => type.kind === 'profile').map((type) => single(repo, type))
	)
	const profile = singles
		.filter((type) => isProfileName(type.nsid))
		.sort((a, b) => a.nsid.split('.').length - b.nsid.split('.').length)[0]
	const byUse = (a: AppType, b: AppType) =>
		Number(b.used) - Number(a.used) || a.name.localeCompare(b.name)
	return {
		app: appOf(seed),
		namespace: namespaceOf(seed),
		profile,
		lists: types.filter((type) => type.kind !== 'profile').sort(byUse),
		singles: singles.filter((type) => type !== profile).sort(byUse),
		published
	}
}

function byNamespace(collections: string[]): Map<string, string[]> {
	const groups = new Map<string, string[]>()
	for (const nsid of [...collections].sort()) {
		const namespace = namespaceOf(nsid)
		groups.set(namespace, [...(groups.get(namespace) ?? []), nsid])
	}
	return groups
}

const built = new Map<string, Promise<RepoApp[]>>()

/** The apps a repo has records of, kept for the session (the repo page and its apps' pages) */
export function repoApps(repo: Identity, collections: string[]): Promise<RepoApp[]> {
	const key = `${repo.did} ${collections.join(' ')}`
	let apps = built.get(key)
	if (!apps) {
		apps = Promise.all(
			[...byNamespace(collections).values()].map((used) => buildApp(repo, used[0], used))
		)
		apps.catch(() => built.delete(key))
		built.set(key, apps)
	}
	return apps
}

/** The apps of a repo by domain, before their catalogs load */
export function appDomains(collections: string[]): string[] {
	return [...byNamespace(collections).keys()].map((namespace) => appOf(namespace + '.x'))
}

const known = new Map<string, Promise<RepoApp>>()

/**
 * An app as its catalog describes it, none used yet: a directory app, or any other
 * found by one of its types (`seed`)
 */
export function knownApp(namespace: string, seed?: string): Promise<RepoApp> {
	let app = known.get(namespace)
	if (!app) {
		app = buildApp(undefined, seed ?? directoryTypes(namespace)[0] ?? `${namespace}.x`, [])
		known.set(namespace, app)
	}
	return app
}

/** Every app of the directory, as types to create */
export function knownApps(): Promise<RepoApp[]> {
	return Promise.all(directoryApps().map((app) => knownApp(app.namespace)))
}

/** Every type of the app a type is in, as its catalog lists them */
export async function appTypesOf(nsid: string): Promise<AppType[]> {
	const app = await knownApp(namespaceOf(nsid), nsid)
	return [...(app.profile ? [app.profile] : []), ...app.lists, ...app.singles]
}
