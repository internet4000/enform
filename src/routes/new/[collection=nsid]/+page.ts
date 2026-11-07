import {error} from '@sveltejs/kit'
import {LexiconNotFound, resolveLexicon} from '#lib/lexicons/resolve'

export async function load({params}) {
	const lexicon = await resolveLexicon(params.collection).catch((err: Error) =>
		error(err instanceof LexiconNotFound ? 404 : 502, err.message)
	)
	if (lexicon.defs.main?.type !== 'record') error(404, `${params.collection} is not a record`)
	return {lexicon}
}
