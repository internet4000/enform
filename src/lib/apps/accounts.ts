/**
 * An app's own accounts, as the protocol names them: the account its domain is the
 * handle of, and the account that publishes its lexicons (`_lexicon` TXT records),
 * often one and the same. Shown with what they have in the app, as anyone's would be:
 * no list of accounts is kept, and an account with nothing in the app isn't shown.
 */
import {NSID} from '@atproto/syntax'
import {txtDids} from '#lib/atproto/dns'
import {resolveIdentity, type Identity} from '#lib/atproto/identity'
import {listCollections} from '#lib/atproto/repo'
import {isExample} from '#lib/lexicons/examples/index'
import {repoApps} from './apps'
import {appOf} from './names'
import type {RepoApp} from './types'

/** Why an account is the app's: its domain names it, it publishes the app's types */
export type AccountReason = 'domain' | 'lexicons'

export type AppAccount = {repo: Identity; app: RepoApp; why: AccountReason[]}

/** The NSIDs of an app's types */
const typesOf = (app: RepoApp) => [
	...(app.profile ? [app.profile.nsid] : []),
	...app.lists.map((type) => type.nsid),
	...app.singles.map((type) => type.nsid)
]

async function find(app: RepoApp): Promise<AppAccount[]> {
	if (isExample(`${app.namespace}.x`)) return []
	const domain = appOf(`${app.namespace}.x`)
	// Each authority its types are published under (feed.bsky.app, graph.bsky.app…)
	const authorities = [
		...new Set([domain, ...typesOf(app).map((nsid) => NSID.parse(nsid).authority)])
	]
	const publishers = (
		await Promise.all(authorities.map((name) => txtDids(`_lexicon.${name}`).catch(() => [])))
	).flat()
	const candidates: [string, AccountReason][] = [
		[domain, 'domain'],
		...publishers.map((did): [string, AccountReason] => [did, 'lexicons'])
	]
	const found = await Promise.all(
		candidates.map(([actor, why]) =>
			resolveIdentity(actor).then(
				(repo) => ({repo, why}),
				() => undefined
			)
		)
	)
	// One per account, with every reason it is the app's
	const accounts = new Map<string, {repo: Identity; why: AccountReason[]}>()
	for (const each of found) {
		if (!each) continue
		const known = accounts.get(each.repo.did)
		if (known && !known.why.includes(each.why)) known.why.push(each.why)
		else if (!known) accounts.set(each.repo.did, {repo: each.repo, why: [each.why]})
	}
	const withRecords = await Promise.all(
		[...accounts.values()].map(async ({repo, why}) => {
			const collections = (await listCollections(repo).catch(() => [])).filter((nsid) =>
				nsid.startsWith(`${app.namespace}.`)
			)
			if (!collections.length) return undefined
			const theirs = (await repoApps(repo, collections)).find(
				(one) => one.namespace === app.namespace
			)
			return theirs ? {repo, app: theirs, why} : undefined
		})
	)
	return withRecords.filter((account) => account !== undefined)
}

const accounts = new Map<string, Promise<AppAccount[]>>()

/** An app's own accounts that have records in it, kept for the session */
export function appAccounts(app: RepoApp): Promise<AppAccount[]> {
	let found = accounts.get(app.namespace)
	if (!found) {
		found = find(app).catch(() => [])
		accounts.set(app.namespace, found)
	}
	return found
}
