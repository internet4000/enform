/** What one does with a record type, in words, from its kind: "Share a link", "Add to Feeds" */
import * as m from '#lib/paraglide/messages.js'
import type {RecordKind} from './kinds'

const VERBS: Partial<Record<RecordKind, () => string>> = {
	profile: m.kind_profile,
	post: m.kind_post,
	link: m.kind_link,
	photo: m.kind_photo,
	follow: m.kind_follow,
	block: m.kind_block,
	reaction: m.kind_reaction,
	status: m.kind_status,
	event: m.kind_event
}

/** The verb for a kind; kinds without one of their own (a list, a thing) name their type */
export function kindVerb(kind: RecordKind, label: string): {verb: string; named: boolean} {
	const verb = VERBS[kind]
	return verb ? {verb: verb(), named: false} : {verb: m.kind_add_to({type: label}), named: true}
}
