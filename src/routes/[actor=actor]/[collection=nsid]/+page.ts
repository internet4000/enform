// A collection's old address: now in the data view, in its app (with ?new, its form)
import {redirect} from '@sveltejs/kit'
import {actorParam, addressOf, collectionPath, createPath} from '#lib/paths'

export function load({params, url}) {
	const actor = actorParam(params.actor)
	const creating = addressOf(url).searchParams.has('new')
	redirect(308, (creating ? createPath : collectionPath)(actor, params.collection))
}
