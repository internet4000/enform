/**
 * Example apps (docs/examples.md): lexicons under `example`, a reserved domain (RFC 2606)
 * no one can publish lexicons for, so they come with enform; each app is generated from
 * its types alone. Their records stay on this device: never written to a repo
 * (src/lib/atproto/write.ts). Listed by hand, so the CLI (Bun) reads them as the app does.
 */
import type {LexiconDoc} from '../types'
import l0 from './example.blog.post.json' with {type: 'json'}
import l1 from './example.bookmark.link.json' with {type: 'json'}
import l2 from './example.event.event.json' with {type: 'json'}
import l3 from './example.event.rsvp.json' with {type: 'json'}
import l4 from './example.note.entry.json' with {type: 'json'}
import l5 from './example.note.profile.json' with {type: 'json'}
import l6 from './example.radio.follow.json' with {type: 'json'}
import l7 from './example.radio.profile.json' with {type: 'json'}
import l8 from './example.radio.track.json' with {type: 'json'}
import l9 from './example.recipe.recipe.json' with {type: 'json'}
import l10 from './example.status.status.json' with {type: 'json'}

const exampleLexicons = [l0, l1, l2, l3, l4, l5, l6, l7, l8, l9, l10] as LexiconDoc[]

const byId = new Map(exampleLexicons.map((doc) => [doc.id, doc]))

/** An NSID of an example app (example.note.entry) */
export const isExample = (nsid: string) => nsid.startsWith('example.')

export function exampleLexicon(nsid: string): LexiconDoc | undefined {
	return byId.get(nsid)
}

/** An example app's record types, in its namespace (example.note) */
export function exampleTypes(namespace: string): LexiconDoc[] {
	return exampleLexicons.filter((doc) => doc.id.startsWith(`${namespace}.`))
}

/** Every example app, by namespace */
export const exampleNamespaces = [
	...new Set(exampleLexicons.map((doc) => doc.id.split('.').slice(0, 2).join('.')))
]

export {exampleLexicons}
