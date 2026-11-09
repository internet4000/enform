import {error} from '@sveltejs/kit'
import {LOCAL_PREFIX, localIdentity, resolveIdentity} from '#lib/atproto/identity'
import {getProfile, profileBySlug} from '#lib/local/store'
import {isLocalHandle, LOCAL_TLD} from '#lib/local/handle'
import {listCollections} from '#lib/atproto/repo'
import {repoApps} from '#lib/apps/apps'
import {actorParam} from '#lib/paths'

export async function load({params}) {
	const actor = actorParam(params.actor)
	// A local profile by its handle (my-radio.local), or by its id (links made before)
	const repo = isLocalHandle(actor)
		? await localRepo(actor.slice(0, -LOCAL_TLD.length), true)
		: actor.startsWith(LOCAL_PREFIX)
			? await localRepo(actor.slice(LOCAL_PREFIX.length))
			: await resolveIdentity(actor).catch((err: Error) => error(404, err.message))
	const collections = await listCollections(repo).catch((err: Error) => error(502, err.message))
	// Not awaited: apps' catalogs and profiles resolve while the panes show
	return {actor, repo, collections, apps: repoApps(repo, collections)}
}

/** A local profile, in this browser only */
async function localRepo(key: string, bySlug = false) {
	const profile = await (bySlug ? profileBySlug(key) : getProfile(key)).catch(() => undefined)
	if (!profile) error(404, key)
	return localIdentity(profile)
}
