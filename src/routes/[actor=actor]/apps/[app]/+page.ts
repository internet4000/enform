import {error} from '@sveltejs/kit'
import {listCollections} from '#lib/atproto/repo'
import {repoApps} from '#lib/apps/apps'

export async function load({parent, params}) {
	const {repo} = await parent()
	const collections = await listCollections(repo).catch((err: Error) => error(502, err.message))
	const app = (await repoApps(repo, collections)).find((app) => app.app === params.app)
	if (!app) error(404, params.app)
	return {app}
}
