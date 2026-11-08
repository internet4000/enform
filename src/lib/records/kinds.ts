/**
 * What kind of thing a record type is, read from its lexicon's shape alone: a profile,
 * a post, a photo, a link, a follow, a reaction, a status, an event, a list. The
 * interface adapts to it (actions in plain words, cards and details shaped for it),
 * for every app, with no per-app code. Keyed on lexicon definitions (docs/principles.md).
 */
import type {LexiconDoc, LexNode} from '#lib/lexicons/types'

export type RecordKind =
	| 'profile'
	| 'follow'
	| 'reaction'
	| 'photo'
	| 'link'
	| 'post'
	| 'status'
	| 'event'
	| 'list'
	| 'thing'

/** The fields that carry a kind: the ones its views and forms put first */
export type KindFields = {
	text?: string
	title?: string
	url?: string
	image?: string
	subject?: string
	start?: string
	value?: string
}

export type Kind = {kind: RecordKind; fields: KindFields}

const TITLE = ['title', 'name', 'displayName', 'label']
const TEXT = ['text', 'content', 'body', 'description', 'summary']
const START = ['startsAt', 'startAt', 'startDate', 'start', 'startedAt', 'beginsAt']

const isString = (node?: LexNode) => node?.type === 'string'
const isImage = (node?: LexNode) =>
	node?.type === 'blob' && (!node.accept || node.accept.some((type) => type.startsWith('image/')))
const isStrongRef = (node?: LexNode) =>
	node?.type === 'ref' && /com\.atproto\.repo\.strongRef/.test(node.ref ?? '')

function find(
	properties: Record<string, LexNode>,
	keys: string[],
	test: (node?: LexNode) => boolean
) {
	return keys.find((key) => test(properties[key]))
}

export function kindOf(doc: LexiconDoc | undefined): Kind {
	const main = doc?.defs.main
	const properties = main?.record?.properties ?? {}
	const keys = Object.keys(properties)
	const own = keys.filter((key) => !/At$/.test(key) || START.includes(key))
	const title = find(properties, TITLE, isString)
	const text = find(properties, TEXT, (node) => isString(node) && !node?.format)
	const url = keys.find(
		(key) => properties[key].type === 'string' && properties[key].format === 'uri'
	)
	const image = keys.find((key) => isImage(properties[key]))
	// An avatar or a cover dresses something with a title; it doesn't make it a photo
	const decorative = !!image && !!title && /avatar|icon|logo|banner|cover|thumb/i.test(image)
	const start = find(properties, START, (node) => isString(node) && node?.format === 'datetime')

	if (main?.key?.startsWith('literal:') && (title || image || text)) {
		return {kind: 'profile', fields: {title, text, image}}
	}
	const subject = properties.subject
	if (subject && isString(subject) && subject.format === 'did' && !text) {
		return {kind: 'follow', fields: {subject: 'subject'}}
	}
	if (subject && isStrongRef(subject)) return {kind: 'reaction', fields: {subject: 'subject'}}
	if (start) return {kind: 'event', fields: {title, text, start}}
	if (image && !decorative) return {kind: 'photo', fields: {image, text: text ?? title}}
	if (url) return {kind: 'link', fields: {url, title, text}}
	// One short value, its own (an emoji, a choice): a status
	const values = own.filter((key) => isString(properties[key]) && !properties[key].format)
	if (values.length === 1 && !title) {
		const node = properties[values[0]]
		const short =
			(node.maxGraphemes ?? node.maxLength ?? Infinity) <= 64 || !!node.knownValues || !!node.enum
		if (short) return {kind: 'status', fields: {value: values[0]}}
	}
	if (text === 'text' || (text && !title)) return {kind: 'post', fields: {text, title}}
	if (title) return {kind: 'list', fields: {title, text, image}}
	return {kind: 'thing', fields: {}}
}
