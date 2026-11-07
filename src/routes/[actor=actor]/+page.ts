import {error} from '@sveltejs/kit'
import {listCollections} from '#lib/atproto/repo'
import {groupByAuthority} from '#lib/collections'

export async function load({parent}) {
	const {repo} = await parent()
	const collections = await listCollections(repo).catch((err: Error) => error(502, err.message))
	return {groups: groupByAuthority(collections)}
}
