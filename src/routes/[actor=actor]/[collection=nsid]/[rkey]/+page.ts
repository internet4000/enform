// A record's old address: now in the data view, in its app (with ?edit, its form)
import {redirect} from '@sveltejs/kit'
import {actorParam, addressOf, editPath, recordPath} from '#lib/paths'

export function load({params, url}) {
	const actor = actorParam(params.actor)
	const editing = addressOf(url).searchParams.has('edit')
	redirect(308, (editing ? editPath : recordPath)(actor, params.collection, params.rkey))
}
