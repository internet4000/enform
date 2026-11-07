/** Who a repo is, from its apps' profiles: the first with a name or picture, Bluesky's first */
import {recordCard, type Card} from '#lib/records/card'
import type {RepoApp} from './types'

export function personCard(apps: RepoApp[]): Card | undefined {
	const profiles = apps
		.map((app) => app.profile)
		.filter((profile) => profile?.record)
		.sort(
			(a, b) =>
				Number(b?.nsid === 'app.bsky.actor.profile') - Number(a?.nsid === 'app.bsky.actor.profile')
		)
	const profile = profiles[0]
	return profile?.record
		? recordCard(profile.record.value, profile.lexicon?.defs.main?.record)
		: undefined
}
