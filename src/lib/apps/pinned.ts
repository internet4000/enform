/** A pinned profile in an app, to show and open: its account's handle now, its screen */
import {resolveIdentity} from '#lib/atproto/identity'
import {actorName, appScreenPath} from '#lib/paths'
import {appInfo} from './directory'
import {namespaceOfDomain} from './names'

export type PinnedProfile = {actor: string; app: string; href: string}

const shown = new Map<string, Promise<PinnedProfile>>()

export function pinnedProfile(pin: {did: string; domain: string}): Promise<PinnedProfile> {
	const key = `${pin.did}/${pin.domain}`
	let found = shown.get(key)
	if (!found) {
		const app = appInfo(namespaceOfDomain(pin.domain)).name
		found = resolveIdentity(pin.did)
			.then((identity) => actorName(identity))
			.catch(() => pin.did)
			.then((actor) => ({actor: `@${actor}`, app, href: appScreenPath(actor, pin.domain)}))
		shown.set(key, found)
	}
	return found
}
