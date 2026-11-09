/** A granted scope, read back as the permissions it holds, to show people in plain words */
import {BlobPermission, IdentityPermission, RepoPermission} from '@atproto/oauth-scopes'

export type Grant =
	| {kind: 'repo'; collections: string[]; actions: string[]}
	| {kind: 'blob'; accept: string[]}
	| {kind: 'identity'; attr: string}

export function grants(scope: string | undefined): Grant[] {
	return (scope ?? '').split(' ').flatMap((token): Grant[] => {
		const repo = RepoPermission.fromString(token)
		if (repo) return [{kind: 'repo', collections: [...repo.collection], actions: [...repo.action]}]
		const blob = BlobPermission.fromString(token)
		if (blob) return [{kind: 'blob', accept: [...blob.accept]}]
		const identity = IdentityPermission.fromString(token)
		if (identity) return [{kind: 'identity', attr: identity.attr}]
		return []
	})
}
