import {error} from '@sveltejs/kit'
import {listRecords} from '#lib/atproto/repo'
import {resolveLexicon} from '#lib/lexicons/resolve'

export async function load({parent, params}) {
	const {repo} = await parent()
	const collection = params.collection
	// Not awaited: records show right away, laid out once their lexicon arrives
	const lexicon = resolveLexicon(collection).catch(() => undefined)
	const page = await listRecords(repo, collection).catch((err: Error) => error(502, err.message))
	return {collection, lexicon, page}
}
