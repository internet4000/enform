/**
 * A pinned profile in an app, to show and open: its account's handle now, the person's
 * name and face when they have them, and its screen
 */
import {resolvePerson} from '#lib/records/links'
import {actorName, appScreenPath} from '#lib/paths'
import {appInfo} from './directory'
import {namespaceOfDomain} from './names'

export type PinnedProfile = {
	actor: string
	app: string
	href: string
	name?: string
	avatar?: string
}

const shown = new Map<string, Promise<PinnedProfile>>()

export function pinnedProfile(pin: {did: string; domain: string}): Promise<PinnedProfile> {
	const key = `${pin.did}/${pin.domain}`
	let found = shown.get(key)
	if (!found) {
		const app = appInfo(namespaceOfDomain(pin.domain)).name
		found = resolvePerson(pin.did)
			.then((person) => ({
				actor: actorName(person.identity),
				name: person.name,
				avatar: person.avatar
			}))
			.catch(() => ({actor: pin.did, name: undefined, avatar: undefined}))
			.then(({actor, name, avatar}) => ({
				actor: `@${actor}`,
				app,
				href: appScreenPath(actor, pin.domain),
				name,
				avatar
			}))
		shown.set(key, found)
	}
	return found
}
