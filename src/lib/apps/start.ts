/** Where starting on an app begins: its profile when it has one, else its main list */
import {directoryTypes} from './directory'
import type {RepoApp} from './types'

export function startType(app: RepoApp): string | undefined {
	if (app.profile?.lexicon) return app.profile.nsid
	const usual = directoryTypes(app.namespace)
	const lists = app.lists.filter((type) => type.lexicon)
	return (lists.find((type) => usual.includes(type.nsid)) ?? lists[0])?.nsid
}
