/** The app's URLs for repos, collections and records, and parsing what people type */
import {AtUri, isValidDid, isValidHandle} from '@atproto/syntax'
import {resolve} from '$app/paths'
import type {Identity} from './atproto/identity'
import {appOf} from './apps/names'

/**
 * A link to an address in the app: `#/@alice/apps/bsky.app?type=…`. The address is after
 * `#`, the part of a URL a browser never sends: the host serving the app sees only that
 * the app was opened, never whose repo, which app or what record (hash routing). Relative
 * to the page, so an instance can live at a domain's root or in any of its folders
 * (docs/self-host.md).
 */
export function inApp(path: string): string {
	return resolve(path.replace(/^\//, ''))
}

/** Where a page of the app is: its address (after `#`), as a URL of its own */
export function addressOf(url: Pick<URL, 'hash' | 'origin'>): URL {
	return new URL(url.hash.replace(/^#/, '') || '/', url.origin)
}

/** An address (from `addressOf`) as a link again */
export const hrefOf = (address: URL): string => inApp(address.pathname + address.search)

/** A repo's name in URLs: its verified handle, else its DID */
export function actorName(repo: Pick<Identity, 'did' | 'handle'>): string {
	return repo.handle ?? repo.did
}

export function repoPath(actor: string): string {
	return inApp(`/@${actor}`)
}

/** A collection as it is stored: in the data view, in its app */
export function collectionPath(actor: string, collection: string): string {
	return dataScreenPath(actor, appOf(collection), {type: collection})
}

/** A record as it is stored: in the data view, in its app */
export function recordPath(actor: string, collection: string, rkey: string): string {
	return dataScreenPath(actor, appOf(collection), {type: collection, record: rkey})
}

/** A lexicon's page: what it defines, and its form */
export function lexiconPath(nsid: string): string {
	return inApp(`/lexicon/${nsid}`)
}

/** An at:// URI's page in the app */
export function atUriPath(uri: string): string | undefined {
	try {
		const at = new AtUri(uri)
		if (!at.collection) return repoPath(at.host)
		if (!at.rkey) return collectionPath(at.host, at.collection)
		return recordPath(at.host, at.collection, at.rkey)
	} catch {
		return undefined
	}
}

/** An at:// URI as its app shows it: a record open over its app's screen, else as stored */
export function atUriAppPath(uri: string): string | undefined {
	try {
		const at = new AtUri(uri)
		if (!at.collection || !at.rkey) return atUriPath(uri)
		return appScreenPath(at.host, appOf(at.collection), {type: at.collection, record: at.rkey})
	} catch {
		return undefined
	}
}

/** What someone typed to open a repo: a handle (with or without @), a DID or an at:// URI */
export function searchPath(input: string): string | undefined {
	const value = input.trim().replace(/^@/, '')
	if (value.startsWith('at://')) return atUriPath(value)
	if (isValidDid(value) || isValidHandle(value)) return repoPath(value.toLowerCase())
	return undefined
}

/** What matches a search: people, apps and lexicons */
export function searchResultsPath(query: string): string {
	return inApp(`/search?${new URLSearchParams({q: query})}`)
}

/** The actor in a route's `@actor` segment */
export function actorParam(param: string): string {
	return decodeURIComponent(param.slice(1))
}

/** Where to create a record of a collection, in the signed-in account's repo */
export function newPath(collection?: string): string {
	return inApp(collection ? `/new/${collection}` : '/new')
}

export function editPath(actor: string, collection: string, rkey: string): string {
	return dataScreenPath(actor, appOf(collection), {type: collection, record: rkey, edit: true})
}

/** Creating a record in a collection of your repo, beside its records */
export function createPath(actor: string, collection: string): string {
	return dataScreenPath(actor, appOf(collection), {type: collection, create: true})
}

/** An app in the directory: what it is, and how to start on it */
export function appPath(domain: string, type?: string): string {
	return inApp(type ? `/apps/${domain}?type=${type}` : `/apps/${domain}`)
}

/*
 * A repo has two views at the same addresses, the data view's under /data: as its apps
 * show it (/@alice/apps/bsky.app?type=…&record=…) and as it is stored
 * (/data/@alice/apps/bsky.app?type=…&record=…). Switching views keeps one's place.
 */

/** A repo's data, all of it, in panes */
export function dataPath(actor: string): string {
	return inApp(`/data/@${actor}`)
}

export type AppScreen = {type?: string; record?: string; edit?: boolean; create?: boolean}

function screenQuery(open: AppScreen): string {
	const params = new URLSearchParams()
	if (open.type) params.set('type', open.type)
	if (open.record) params.set('record', open.record)
	if (open.edit) params.set('edit', '')
	if (open.create) params.set('new', '')
	const query = params.toString().replace(/=(&|$)/g, '$1')
	return query ? `?${query}` : ''
}

/** An app as a person has it: its screen, a tab (a type), a record or a form open over it */
export function appScreenPath(actor: string, domain: string, open: AppScreen = {}): string {
	return `${repoPath(actor)}/apps/${domain}${screenQuery(open)}`
}

/** An app's data as stored, in panes: its collections, a collection, a record or a form */
export function dataScreenPath(actor: string, domain: string, open: AppScreen = {}): string {
	return `${dataPath(actor)}/apps/${domain}${screenQuery(open)}`
}
