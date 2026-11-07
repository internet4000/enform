/** A granted scope, read back as the permissions it holds, to show people in plain words */
import {BlobPermission, RepoPermission} from '@atproto/oauth-scopes'

export type Grant =
	{kind: 'repo'; collections: string[]; actions: string[]} | {kind: 'blob'; accept: string[]}

export function grants(scope: string | undefined): Grant[] {
	return (scope ?? '').split(' ').flatMap((token): Grant[] => {
		const repo = RepoPermission.fromString(token)
		if (repo) return [{kind: 'repo', collections: [...repo.collection], actions: [...repo.action]}]
		const blob = BlobPermission.fromString(token)
		if (blob) return [{kind: 'blob', accept: [...blob.accept]}]
		return []
	})
}
