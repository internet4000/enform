/**
 * Which permissions a session holds and which to ask for, using atproto's own scope
 * library (https://atproto.com/specs/permission).
 *
 * An authorization server accepts only scopes the client metadata declares, as exact
 * strings. So collections listed in config/permissions.json are authorized one
 * collection and action at a time, any other collection with `repo:*` for that action.
 */
import {ScopePermissions} from '@atproto/oauth-scopes'
import permissions from '#lib/config/permissions.json' with {type: 'json'}

export type RepoAction = 'create' | 'update' | 'delete'

export const BASE_SCOPE = 'atproto'

const ACTIONS: RepoAction[] = ['create', 'update', 'delete']

export const repoScope = (collection: string, action: RepoAction) =>
	`repo:${collection}?action=${action}`

export const blobScope = (accept: string) => `blob:${accept}`

/** Every scope enform may ask for, as its client metadata declares them */
export const DECLARED_SCOPES: string[] = [
	BASE_SCOPE,
	...ACTIONS.map((action) => repoScope('*', action)),
	...permissions.collections.flatMap((collection) =>
		ACTIONS.map((action) => repoScope(collection, action))
	),
	...permissions.blobs.map(blobScope)
]

/**
 * The permissions a write needs, as the PDS checks them: an update is sent with
 * putRecord, which can also create the record, so it needs both create and update
 */
export function actionsFor(action: RepoAction): RepoAction[] {
	return action === 'update' ? ['create', 'update'] : [action]
}

export function allowsRepo(granted: string | undefined, collection: string, action: RepoAction) {
	return new ScopePermissions(granted).allowsRepo({collection, action})
}

export function allowsBlob(granted: string | undefined, mime: string) {
	return new ScopePermissions(granted).allowsBlob({mime})
}

/** Whether writing to this collection can be authorized for it alone */
export function isDeclared(collection: string): boolean {
	return permissions.collections.includes(collection)
}

/** The declared scope that allows this write: the collection's own, else all collections' */
export function scopeForRepo(collection: string, action: RepoAction): string {
	return repoScope(isDeclared(collection) ? collection : '*', action)
}

/** The narrowest declared blob scope that allows this MIME type */
export function scopeForBlob(mime: string): string {
	const accept =
		permissions.blobs.find(
			(pattern) => pattern !== '*/*' && allowsBlob(blobScope(pattern), mime)
		) ?? '*/*'
	return blobScope(accept)
}

/**
 * The scope to request so that `needed` is allowed too. A new authorization replaces
 * the session's scope, so it's everything granted so far plus what's new, limited to
 * declared scopes (anything else would be refused).
 */
export function withScopes(granted: string | undefined, needed: string[]): string {
	const held = (granted ?? '').split(' ').filter((scope) => DECLARED_SCOPES.includes(scope))
	return [...new Set([BASE_SCOPE, ...held, ...needed])].join(' ')
}
