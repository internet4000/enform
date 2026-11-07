import {error} from '@sveltejs/kit'
import {LexiconNotFound, resolveLexicon} from '#lib/lexicons/resolve'

export async function load({params}) {
	const lexicon = await resolveLexicon(params.nsid).catch((err: Error) =>
		error(err instanceof LexiconNotFound ? 404 : 502, err.message)
	)
	return {lexicon}
}
