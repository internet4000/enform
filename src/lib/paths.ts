/** The app's URLs for repos, collections and records, and parsing what people type */
import {AtUri, isValidDid, isValidHandle} from '@atproto/syntax'
import {resolve} from '$app/paths'
import type {Identity} from './atproto/identity'

/**
 * A path in the app, under the folder it is served from: an instance can live at a
 * domain's root or in any folder of it (docs/self-host.md)
 */
export function inApp(path: string): string {
	return resolve(path.replace(/^\//, ''))
}

/** A repo's name in URLs: its verified handle, else its DID */
export function actorName(repo: Pick<Identity, 'did' | 'handle'>): string {
	return repo.handle ?? repo.did
}

export function repoPath(actor: string): string {
	return inApp(`/@${actor}`)
}

export function collectionPath(actor: string, collection: string): string {
	return `${repoPath(actor)}/${collection}`
}

export function recordPath(actor: string, collection: string, rkey: string): string {
	return `${collectionPath(actor, collection)}/${encodeURIComponent(rkey)}`
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
	return `${recordPath(actor, collection, rkey)}?edit`
}

/** Creating a record in a collection of your repo, beside its records */
export function createPath(actor: string, collection: string): string {
	return `${collectionPath(actor, collection)}?new`
}

/** An app in the directory: what it is, and how to start on it */
export function appPath(domain: string, type?: string): string {
	return inApp(type ? `/apps/${domain}?type=${type}` : `/apps/${domain}`)
}

/** A repo's data, all of it, in panes (the advanced view) */
export function dataPath(actor: string): string {
	return `${repoPath(actor)}/data`
}

export type AppScreen = {type?: string; record?: string; edit?: boolean; create?: boolean}

/** An app as a person has it: its screen, a tab (a type), a record or a form open over it */
export function appScreenPath(actor: string, domain: string, open: AppScreen = {}): string {
	const params = new URLSearchParams()
	if (open.type) params.set('type', open.type)
	if (open.record) params.set('record', open.record)
	if (open.edit) params.set('edit', '')
	if (open.create) params.set('new', '')
	const query = params.toString().replace(/=(&|$)/g, '$1')
	return `${repoPath(actor)}/apps/${domain}${query ? `?${query}` : ''}`
}
