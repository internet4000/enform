/**
 * Quick actions, from lexicons alone: what one makes most in one's apps (a post, a track,
 * a status).
 */
import type {AppType, RepoApp} from './types'
import type {LexiconDoc} from '#lib/lexicons/types'
import {kindOf, type RecordKind} from '#lib/records/kinds'

/** Kinds one starts from nothing, most made first; the others need a record to aim at */
const MADE: RecordKind[] = ['post', 'link', 'photo', 'status', 'event', 'list']

export type QuickAction = {app: RepoApp; type: AppType; kind: RecordKind}

/** A type whose records must point at an account or a record: made from there, not here */
function needsTarget(doc: LexiconDoc | undefined): boolean {
	const record = doc?.defs.main?.record
	return (record?.required ?? []).some((key) => {
		const node = record?.properties?.[key]
		return (
			(node?.type === 'string' && (node.format === 'did' || node.format === 'at-uri')) ||
			(node?.type === 'ref' && /strongRef/.test(node.ref ?? ''))
		)
	})
}

/** Per app, the types one makes (used ones first, then by kind), up to `perApp` each */
export function quickActions(apps: RepoApp[], perApp = 2): QuickAction[] {
	return apps.flatMap((app) =>
		app.lists
			.filter((type) => type.lexicon && !needsTarget(type.lexicon))
			.map((type) => ({app, type, kind: kindOf(type.lexicon).kind}))
			.filter(({kind}) => MADE.includes(kind))
			.sort(
				(a, b) =>
					Number(b.type.used) - Number(a.type.used) || MADE.indexOf(a.kind) - MADE.indexOf(b.kind)
			)
			.slice(0, perApp)
	)
}
