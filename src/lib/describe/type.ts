/**
 * What a record type is, from its lexicon, else from sample records: its kind (a
 * profile, a post, a link…), the role each field plays (its title, text, link,
 * picture, date…), how many records an account has of it, what its records point at,
 * and why each was decided, so the interface can explain it and people can change it.
 * The same rules for every app (docs/architecture.md › Where it is going).
 */
import type {LexiconDoc} from '#lib/lexicons/types'
import {fieldsFromLexicon, fieldsFromRecords, type Field, type FieldSource} from './fields'

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

/** The fields that carry a type's meaning: the ones views and forms put first */
export type Roles = {
	title?: string
	text?: string
	url?: string
	image?: string
	subject?: string
	start?: string
	/** A status's one value */
	value?: string
	/** When a record was made */
	date?: string
}

/** One record per account (a profile), a list of them, or records keyed by what they are */
export type Count = 'one' | 'many' | 'keyed'

/** Why something was decided: what it is about, the rule, and the fields it read */
export type Reason = {about: keyof Roles | 'kind' | 'count'; rule: string; fields: string[]}

export type TypeDescription = {
	nsid: string
	kind: RecordKind
	roles: Roles
	count?: Count
	/** Fields pointing at accounts (a DID) and at records (an at:// URI, a strongRef) */
	points: {accounts: string[]; records: string[]}
	/** Where the description comes from: a lexicon is certain, records are a guess */
	source: FieldSource
	why: Reason[]
	fields: Field[]
}

/** A sample record of the type: its key and value */
export type Sample = {rkey: string; value: Record<string, unknown>}

const TITLE = ['title', 'name', 'displayName', 'label']
const TEXT = ['text', 'content', 'body', 'description', 'summary']
const START = ['startsAt', 'startAt', 'startDate', 'start', 'startedAt', 'beginsAt']
const DATE = ['createdAt', 'created_at', 'publishedAt', 'published_at', 'indexedAt']
/** A timestamp of the record itself (when it was made or changed), not what it's about */
const STAMP = /(At|_at)$/
/** A picture that dresses something named isn't what it is (an avatar, a cover) */
const DECORATIVE = /avatar|icon|logo|banner|cover|thumb/i
const TID = /^[234567abcdefghij][234567abcdefghijklmnopqrstuvwxyz]{12}$/

const isString = (field?: Field) => field?.type === 'string'
const isImage = (field?: Field) =>
	field?.type === 'blob' &&
	(!field.accept?.length || field.accept.some((type) => type.startsWith('image/')))
const isStrongRef = (field?: Field) =>
	field?.type === 'ref' && /com\.atproto\.repo\.strongRef/.test(field.ref ?? '')

/** Describes a type: from its lexicon when there is one, else from its records */
export function describeType(
	nsid: string,
	from: {lexicon?: LexiconDoc; samples?: Sample[]} = {}
): TypeDescription {
	const {lexicon, samples = []} = from
	const source: FieldSource = lexicon ? 'lexicon' : samples.length ? 'records' : 'none'
	const fields = lexicon
		? fieldsFromLexicon(lexicon)
		: fieldsFromRecords(samples.map((sample) => sample.value))
	const why: Reason[] = []
	const byName = new Map(fields.map((field) => [field.name, field]))
	const named = (names: string[], test: (field?: Field) => boolean) =>
		names.find((name) => test(byName.get(name)))

	// Its roles
	const title = named(TITLE, isString)
	const text = named(TEXT, (field) => isString(field) && !field?.format)
	const url = fields.find((field) => isString(field) && field.format === 'uri')?.name
	const image = fields.find(isImage)?.name
	const start = named(START, (field) => isString(field) && field?.format === 'datetime')
	const date = named(DATE, (field) => isString(field) && field?.format === 'datetime')
	const decorative = !!image && !!title && DECORATIVE.test(image)
	if (title) why.push({about: 'title', rule: 'usual-name', fields: [title]})
	if (text) why.push({about: 'text', rule: 'usual-name', fields: [text]})
	if (url) why.push({about: 'url', rule: 'format-uri', fields: [url]})
	if (image) why.push({about: 'image', rule: 'image-blob', fields: [image]})
	if (start) why.push({about: 'start', rule: 'usual-name-datetime', fields: [start]})
	if (date) why.push({about: 'date', rule: 'usual-name-datetime', fields: [date]})

	// What its records point at
	const accounts = fields
		.filter((field) => isString(field) && field.format === 'did')
		.map((f) => f.name)
	const records = fields
		.filter((field) => (isString(field) && field.format === 'at-uri') || isStrongRef(field))
		.map((field) => field.name)

	// How many an account has: its lexicon's key, else its records' keys
	const count = countOf(lexicon, samples, why)

	const done = (kind: RecordKind, roles: Roles, rule: string, read: string[]) => {
		why.unshift({about: 'kind', rule, fields: read})
		return {
			nsid,
			kind,
			roles: {...roles, date},
			count,
			points: {accounts, records},
			source,
			why,
			fields
		}
	}

	const one = count === 'one'
	if (one && (title || image || text)) {
		return done('profile', {title, text, image}, 'one-per-account-named', [
			...[title, image, text].filter((name): name is string => !!name)
		])
	}
	const subject = byName.get('subject')
	if (subject && isString(subject) && subject.format === 'did' && !text) {
		return done('follow', {subject: 'subject'}, 'subject-account', ['subject'])
	}
	if (isStrongRef(subject)) {
		return done('reaction', {subject: 'subject'}, 'subject-record', ['subject'])
	}
	if (start) return done('event', {title, text, start}, 'has-start', [start])
	if (image && !decorative) {
		return done('photo', {image, text: text ?? title}, 'has-image', [image])
	}
	if (url) return done('link', {url, title, text}, 'has-link', [url])
	// One short value, its own (an emoji, a choice): a status
	const own = fields.filter((field) => !STAMP.test(field.name) || START.includes(field.name))
	const values = own.filter((field) => isString(field) && !field.format)
	if (values.length === 1 && !title && values[0].short) {
		return done('status', {value: values[0].name}, 'one-short-value', [values[0].name])
	}
	if (text === 'text' || (text && !title)) {
		return done('post', {text, title}, 'has-text', [text])
	}
	if (title) return done('list', {title, text, image}, 'has-title', [title])
	return done('thing', {}, 'nothing-telling', [])
}

function countOf(
	lexicon: LexiconDoc | undefined,
	samples: Sample[],
	why: Reason[]
): Count | undefined {
	const key = lexicon?.defs.main?.key
	if (key) {
		const count: Count = key.startsWith('literal:') ? 'one' : key === 'tid' ? 'many' : 'keyed'
		why.push({about: 'count', rule: `key-${key.split(':')[0]}`, fields: []})
		return count
	}
	if (!samples.length) return undefined
	if (samples.every((sample) => sample.rkey === 'self')) {
		why.push({about: 'count', rule: 'records-keyed-self', fields: []})
		return 'one'
	}
	if (samples.every((sample) => TID.test(sample.rkey))) {
		why.push({about: 'count', rule: 'records-keyed-tid', fields: []})
		return 'many'
	}
	why.push({about: 'count', rule: 'records-keyed-other', fields: []})
	return 'keyed'
}
