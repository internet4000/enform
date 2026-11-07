import {error} from '@sveltejs/kit'
import {listCollections} from '#lib/atproto/repo'
import {repoApps} from '#lib/apps'

export async function load({parent}) {
	const {repo} = await parent()
	const collections = await listCollections(repo).catch((err: Error) => error(502, err.message))
	// Not awaited: lexicons and profiles resolve while the page shows
	return {collections, apps: repoApps(repo, collections)}
}
