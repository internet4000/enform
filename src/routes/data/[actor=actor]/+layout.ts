import {loadRepo} from '#lib/atproto/load-repo'

export function load({params}) {
	return loadRepo(params.actor)
}
