import {error} from '@sveltejs/kit'
import {getRecord} from '#lib/atproto/repo'
import {resolveLexicon} from '#lib/lexicons/resolve'

export async function load({parent, params}) {
	const {repo} = await parent()
	const {collection, rkey} = params
	const lexicon = resolveLexicon(collection).catch(() => undefined)
	const record = await getRecord(repo, collection, rkey).catch((err: Error) =>
		error(404, err.message)
	)
	return {collection, rkey, lexicon, record}
}
