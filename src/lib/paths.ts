/** The app's URLs for repos, collections and records, and parsing what people type */
import {AtUri, isValidDid, isValidHandle} from '@atproto/syntax'
import type {Identity} from './atproto/identity'

/** A repo's name in URLs: its verified handle, else its DID */
export function actorName(repo: Pick<Identity, 'did' | 'handle'>): string {
	return repo.handle ?? repo.did
}

export function repoPath(actor: string): string {
	return `/@${actor}`
}

export function collectionPath(actor: string, collection: string): string {
	return `${repoPath(actor)}/${collection}`
}

export function recordPath(actor: string, collection: string, rkey: string): string {
	return `${collectionPath(actor, collection)}/${encodeURIComponent(rkey)}`
}

/** A lexicon's page: what it defines, and its form */
export function lexiconPath(nsid: string): string {
	return `/lexicon/${nsid}`
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

/** The actor in a route's `@actor` segment */
export function actorParam(param: string): string {
	return decodeURIComponent(param.slice(1))
}

/** Where to create a record of a collection, in the signed-in account's repo */
export function newPath(collection?: string): string {
	return collection ? `/new/${collection}` : '/new'
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
	return type ? `/apps/${domain}?type=${type}` : `/apps/${domain}`
}
