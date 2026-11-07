import {error} from '@sveltejs/kit'
import {getRecord} from '#lib/atproto/repo'
import {resolveLexicon} from '#lib/lexicons/resolve'

export async function load({parent, params}) {
	const {repo} = await parent()
	const {collection, rkey} = params
	const [lexicon, record] = await Promise.all([
		resolveLexicon(collection).catch((err: Error) => error(404, err.message)),
		getRecord(repo, collection, rkey).catch((err: Error) => error(404, err.message))
	])
	return {collection, rkey, lexicon, record}
}
