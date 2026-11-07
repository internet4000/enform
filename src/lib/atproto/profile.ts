/** An account's avatar, from its app.bsky.actor.profile record when it has one */
import type {Identity} from './identity'
import {blobUrl, getRecord} from './repo'

const avatars = new Map<string, Promise<string | undefined>>()

/** Where the avatar can be fetched, cached for the session; undefined without one */
export function profileAvatar(repo: Identity): Promise<string | undefined> {
	let avatar = avatars.get(repo.did)
	if (!avatar) {
		avatar = getRecord(repo, 'app.bsky.actor.profile', 'self')
			.then(({value}) => {
				const blob = value.avatar as {ref?: {$link?: string}} | undefined
				return blob?.ref?.$link ? blobUrl(repo, blob.ref.$link) : undefined
			})
			.catch(() => undefined)
		avatars.set(repo.did, avatar)
	}
	return avatar
}
