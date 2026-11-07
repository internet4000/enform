import {error} from '@sveltejs/kit'
import {resolveIdentity} from '#lib/atproto/identity'
import {listCollections} from '#lib/atproto/repo'
import {repoApps} from '#lib/apps/apps'
import {actorParam} from '#lib/paths'

export async function load({params}) {
	const actor = actorParam(params.actor)
	const repo = await resolveIdentity(actor).catch((err: Error) => error(404, err.message))
	const collections = await listCollections(repo).catch((err: Error) => error(502, err.message))
	// Not awaited: apps' catalogs and profiles resolve while the panes show
	return {actor, repo, collections, apps: repoApps(repo, collections)}
}
