// A repo's data moved under /data, at the app view's addresses: old links still land
import {redirect} from '@sveltejs/kit'
import {actorParam, dataPath} from '#lib/paths'

export function load({params}) {
	redirect(308, dataPath(actorParam(params.actor)))
}
