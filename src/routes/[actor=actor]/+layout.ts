import {error} from '@sveltejs/kit'
import {resolveIdentity} from '#lib/atproto/identity'
import {actorParam} from '#lib/paths'

export async function load({params}) {
	const actor = actorParam(params.actor)
	const repo = await resolveIdentity(actor).catch((err: Error) => error(404, err.message))
	return {actor, repo}
}
