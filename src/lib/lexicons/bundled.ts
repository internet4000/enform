/**
 * enform's own lexicons, from /lexicons. enform is their namespace's authority, so
 * these files are their source; published, they resolve the same from the network.
 */
import app from '#lib/config/app.json' with {type: 'json'}
import type {LexiconDoc} from './types'

const files = import.meta.glob<LexiconDoc>('../../../lexicons/**/*.json', {
	eager: true,
	import: 'default'
})

const own = new Map(
	Object.values(files)
		.filter((doc) => doc.id.startsWith(`${app.namespace}.`))
		.map((doc) => [doc.id, doc])
)

export function ownLexicon(nsid: string): LexiconDoc | undefined {
	return own.get(nsid)
}
