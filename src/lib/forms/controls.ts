/** Which HTML control suits a lexicon string or integer */
import type {LexNode} from '#lib/lexicons/types'

export type StringControl = 'select' | 'datetime' | 'textarea' | 'input'

/** Properties that name a thing: one line, however long they may be */
const ONE_LINE = /^(title|name|displayName|label|subject|handle|slug)$/

/** Properties that hold prose: several lines, unless kept very short */
const PROSE = /^(text|alt|description|body|content|bio|summary|note|message|comment)$/

/** Limits from which a text is long enough for several lines */
const LONG = 300
const SHORT = 100

export function stringControl(node: LexNode, key = ''): StringControl {
	if (node.enum) return 'select'
	if (node.format === 'datetime') return 'datetime'
	if (node.format || node.knownValues || ONE_LINE.test(key)) return 'input'
	const limit = node.maxGraphemes ?? node.maxLength
	const long = PROSE.test(key) ? SHORT : LONG
	return limit === undefined || limit >= long ? 'textarea' : 'input'
}

const INPUT_TYPES: Record<string, string> = {uri: 'url'}

/** The input type for a string format */
export function inputType(format?: string): string {
	return (format && INPUT_TYPES[format]) || 'text'
}

/** Formats that are identifiers: no autocorrect, no capitals, no spellcheck */
export function isIdentifier(format?: string): boolean {
	return !!format && format !== 'datetime'
}

/** Languages suggested for `language` fields: the reader's own, then widely used ones */
const COMMON_LANGUAGES = [
	'en',
	'es',
	'pt',
	'fr',
	'de',
	'it',
	'nl',
	'ja',
	'ko',
	'zh',
	'ar',
	'hi',
	'ru',
	'uk',
	'pl',
	'tr',
	'sv',
	'ca',
	'id',
	'fa'
]

export function suggestedLanguages(preferred: readonly string[]): string[] {
	return [...new Set([...preferred, ...COMMON_LANGUAGES])]
}
