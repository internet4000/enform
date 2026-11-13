/**
 * Filters for a list of records, from its lexicon alone: chips for what a field can only
 * be (an enum, known values, a boolean, a language, tags), the sites its links go to,
 * whether it has an image; a search across its text; and orders (newest, oldest, by a
 * number or a date of its own). Read from and written to the URL, applied to the records
 * loaded so far. Only the filters that split the list are offered.
 */
import type {LexNode} from '#lib/lexicons/types'
import type {RepoRecord} from '#lib/atproto/repo'

/** A filter's value for a record that has nothing in that field (or has a blob: `HAS`) */
export const NONE = '-'
export const HAS = '*'
/** Filters in the URL: `?q=` the text, `?sort=`, and one `?f.<field>=<value>` each */
const PREFIX = 'f.'

export type FacetValue = {value: string; count: number}
export type Facet = {key: string; how: 'value' | 'site' | 'presence' | 'tag'; values: FacetValue[]}
export type Sort = {key: string; field?: string; order: 'asc' | 'desc'}
export type Filters = {q: string; is: Record<string, string>; sort: string}

const MAX_VALUES = 8
/** The filter of the #tags written in a record's texts (a key no field can have) */
export const TAGS = '#'
const HASHTAG = /(?:^|\s)#([\p{L}\p{N}_-]+)/gu

/** A URL, or the page's read-only one */
type Href = {href: string}
/** Search params, or the page's read-only ones */
type Params = Iterable<[string, string]> & {get(name: string): string | null}

const isValue = (node?: LexNode) =>
	(node?.type === 'string' &&
		(!!node.enum || !!node.knownValues || node.format === 'language' || !node.format)) ||
	node?.type === 'boolean' ||
	(node?.type === 'integer' && !!node.enum)
const isImage = (node?: LexNode) =>
	node?.type === 'blob' && (!node.accept || node.accept.some((type) => type.startsWith('image/')))

/** Longer than a post: an item of text (a recipe's step), not a value to filter by */
const TEXT_ITEM = 300
const isText = (node?: LexNode) =>
	node?.type === 'string' && (node.maxGraphemes ?? node.maxLength ?? 0) > TEXT_ITEM

/** How a field can filter: by its values, by the sites of its links, or by having one */
function howOf(node: LexNode): Facet['how'] | undefined {
	if (node.type === 'string' && node.format === 'uri') return 'site'
	if (isImage(node) || (node.type === 'array' && isImage(node.items))) return 'presence'
	if (
		node.type === 'array' &&
		node.items?.type === 'string' &&
		isValue(node.items) &&
		!isText(node.items)
	)
		return 'value'
	if (node.type === 'string' && !node.format && !node.enum && !node.knownValues) return undefined
	if (isValue(node)) return 'value'
	return undefined
}

function host(url: unknown): string | undefined {
	try {
		return new URL(String(url)).hostname.replace(/^www\./, '')
	} catch {
		return undefined
	}
}

/** What a record has for a filter: one value, several (an array), or NONE */
function valuesOf(value: unknown, how: Facet['how']): string[] {
	const empty =
		value === undefined || value === null || value === '' || (Array.isArray(value) && !value.length)
	if (how === 'presence') return [empty ? NONE : HAS]
	if (empty) return [NONE]
	if (how === 'site') return [host(value) ?? NONE]
	return (Array.isArray(value) ? value : [value]).map(String)
}

/** The #tags written in a record's own texts: its fields of plain text, or with no lexicon
    to say which, any text of its own */
function hashtags(node: LexNode | undefined, value: Record<string, unknown>): string[] {
	const properties = node?.properties
	const tags = Object.keys(properties ?? value)
		.filter((key) => !properties || (properties[key].type === 'string' && !properties[key].format))
		.flatMap((key) =>
			typeof value[key] === 'string'
				? [...value[key].matchAll(HASHTAG)].map((match) => match[1].toLowerCase())
				: []
		)
	return [...new Set(tags)]
}

/** What a record has for a filter: its field's values, or its #tags */
function recordValues(node: LexNode | undefined, record: RepoRecord, key: string): string[] {
	if (key === TAGS) return hashtags(node, record.value)
	const field = node?.properties?.[key]
	const how = field ? howOf(field) : undefined
	return how ? valuesOf(record.value[key], how) : []
}

/** The filters a list offers: per field, its values with counts, when they split it */
export function facetsOf(node: LexNode | undefined, records: RepoRecord[]): Facet[] {
	const properties = node?.properties ?? {}
	const fields = Object.entries(properties).flatMap(([key, field]) => {
		const how = howOf(field)
		return how ? [{key, how}] : []
	})
	return [...fields, {key: TAGS, how: 'tag' as const}].flatMap(({key, how}) => {
		const counts = new Map<string, number>()
		for (const record of records)
			for (const value of new Set(recordValues(node, record, key)))
				counts.set(value, (counts.get(value) ?? 0) + 1)
		const values = [...counts]
			.map(([value, count]) => ({value, count}))
			.sort((a, b) => b.count - a.count || a.value.localeCompare(b.value))
		// Splits the list: more than one value, and some value shared, or only a few; #tags
		// do when one is on more than one record and not on all
		const splits =
			how === 'tag'
				? values.some((value) => value.count > 1 && value.count < records.length)
				: values.length > 1 && (values.length <= 4 || values.some((value) => value.count > 1))
		const shown = how === 'tag' ? values.filter((value) => value.count > 1) : values
		return splits ? [{key, how, values: shown.slice(0, how === 'tag' ? 12 : MAX_VALUES)}] : []
	})
}

/** The orders a list offers: newest and oldest, then by each number or date of its own */
export function sortsOf(node: LexNode | undefined): Sort[] {
	const properties = node?.properties ?? {}
	const own = Object.entries(properties).flatMap(([field, value]): Sort[] => {
		if (value.type === 'integer' && !value.enum) return [{key: field, field, order: 'desc'}]
		if (
			value.type === 'string' &&
			value.format === 'datetime' &&
			!/^(created|updated|indexed)At$/.test(field)
		)
			return [{key: field, field, order: 'asc'}]
		return []
	})
	return [{key: 'newest', order: 'desc'}, {key: 'oldest', order: 'asc'}, ...own]
}

export function readFilters(params: Params): Filters {
	const is: Record<string, string> = {}
	for (const [key, value] of params)
		if (key.startsWith(PREFIX)) is[key.slice(PREFIX.length)] = value
	return {q: params.get('q')?.trim() ?? '', is, sort: params.get('sort') ?? 'newest'}
}

export const filtering = (filters: Filters) =>
	!!filters.q || Object.keys(filters.is).length > 0 || filters.sort !== 'newest'

/** The URL with a filter set, or cleared when it is already set to that value */
export function toggled(url: Href, key: string, value: string): string {
	const next = new URL(url.href)
	const name = PREFIX + key
	if (next.searchParams.get(name) === value) next.searchParams.delete(name)
	else next.searchParams.set(name, value)
	return next.pathname + next.search
}

/** The URL with an order, or none for the default one */
export function sorted(url: Href, sort: string): string {
	const next = new URL(url.href)
	if (sort === 'newest') next.searchParams.delete('sort')
	else next.searchParams.set('sort', sort)
	return next.pathname + next.search
}

/** The URL with no filter */
export function cleared(url: Href): string {
	const next = new URL(url.href)
	for (const key of [...next.searchParams.keys()])
		if (key === 'q' || key === 'sort' || key.startsWith(PREFIX)) next.searchParams.delete(key)
	return next.pathname + next.search
}

/** The filters of a URL, to keep them on links that stay in the same list */
export function filterParams(params: Params): [string, string][] {
	return [...params].filter(([key]) => key === 'q' || key === 'sort' || key.startsWith(PREFIX))
}

/** Every text a record holds, for searching it (not its types, links to blobs, or CIDs) */
function texts(value: unknown, out: string[] = []): string[] {
	if (typeof value === 'string') out.push(value)
	else if (Array.isArray(value)) value.forEach((item) => texts(item, out))
	else if (value && typeof value === 'object')
		for (const [key, item] of Object.entries(value))
			if (key !== '$type' && key !== 'ref' && key !== 'cid' && key !== 'mimeType') texts(item, out)
	return out
}

/** Whether texts have every word of a search, in any case */
export function matchesWords(query: string, ...texts: string[]): boolean {
	const text = texts.join(' ').toLowerCase()
	return query
		.toLowerCase()
		.split(/\s+/)
		.filter(Boolean)
		.every((word) => text.includes(word))
}

export const matches = (record: RepoRecord, query: string): boolean =>
	matchesWords(query, ...texts(record.value))

const comparable = (value: unknown) =>
	typeof value === 'number' ? value : typeof value === 'string' ? Date.parse(value) : NaN

/** The records loaded so far that match, in the order chosen */
export function applyFilters(
	node: LexNode | undefined,
	records: RepoRecord[],
	filters: Filters
): RepoRecord[] {
	const properties = node?.properties ?? {}
	const kept = records.filter(
		(record) =>
			(!filters.q || matches(record, filters.q)) &&
			Object.entries(filters.is).every(
				([key, wanted]) =>
					(key !== TAGS && !(properties[key] && howOf(properties[key]))) ||
					recordValues(node, record, key).includes(wanted)
			)
	)
	const sort = sortsOf(node).find((sort) => sort.key === filters.sort)
	if (!sort || sort.key === 'newest') return kept
	if (sort.key === 'oldest') return [...kept].reverse()
	const field = sort.field as string
	const sign = sort.order === 'asc' ? 1 : -1
	return [...kept].sort((a, b) => {
		const [x, y] = [comparable(a.value[field]), comparable(b.value[field])]
		// Those without one, last
		if (Number.isNaN(x) || Number.isNaN(y)) return Number(Number.isNaN(x)) - Number(Number.isNaN(y))
		return (x - y) * sign
	})
}
