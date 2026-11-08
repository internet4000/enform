/**
 * Quick actions, from lexicons alone: what one makes most in one's apps (a post, a track,
 * a status), and what one can do with a person in them, wherever a type points at an
 * account (a `did` field): follow them, write to them (a did and a text: a message in
 * their room), or mention them (a text with rich-text facets).
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

export type ContactWay = 'follow' | 'message' | 'mention'
export type ContactAction = {app: RepoApp; type: AppType; way: ContactWay; field: string}

/** The field of a lexicon's record that names an account, if one does */
function didField(doc: LexiconDoc): string | undefined {
	const properties = doc.defs.main?.record?.properties ?? {}
	return Object.keys(properties).find(
		(key) => properties[key].type === 'string' && properties[key].format === 'did'
	)
}

/** How a type can reach a person: by their DID in it, or by mentioning them in its text */
export function contactWay(
	doc: LexiconDoc | undefined
): {way: ContactWay; field: string} | undefined {
	if (doc?.defs.main?.type !== 'record') return undefined
	const properties = doc.defs.main.record?.properties ?? {}
	const field = didField(doc)
	const {kind, fields} = kindOf(doc)
	// Following: the account alone (a block or a mute is shaped the same, and isn't one)
	const others = (doc.defs.main.record?.required ?? []).filter(
		(key) => key !== field && !/At$/.test(key)
	)
	if (field && kind === 'follow' && !others.length && !/block|mute/i.test(doc.id)) {
		return {way: 'follow', field}
	}
	if (field && fields.text) return {way: 'message', field}
	if (kind === 'post' && fields.text && properties.facets)
		return {way: 'mention', field: fields.text}
	return undefined
}

/** In one's apps, every way to reach someone, one per app and way */
export function contactActions(apps: RepoApp[]): ContactAction[] {
	return apps.flatMap((app) => {
		const seen = new Set<ContactWay>()
		return [...app.lists]
			.filter((type) => type.lexicon)
			.flatMap((type) => {
				const how = contactWay(type.lexicon)
				if (!how || seen.has(how.way)) return []
				seen.add(how.way)
				return [{app, type, ...how}]
			})
	})
}

/** What a contact action's form starts with, for this person */
export function contactPrefill(
	action: ContactAction,
	person: {did: string; handle?: string}
): Record<string, unknown> {
	if (action.way === 'mention') return {[action.field]: `@${person.handle ?? person.did} `}
	return {[action.field]: person.did}
}
