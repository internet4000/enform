/** Shared types of the form generator */
import type {LexNode} from '#lib/lexicons/types'

/** Follows a ref to its definition (resolveRef by default; tests pass their own) */
export type Resolver = (
	ref: string,
	base: string
) => Promise<{node: LexNode; nsid: string} | undefined>

/** A constraint a value breaks. `code` names its i18n message, the rest are its params. */
export type FieldError =
	| {code: 'required'}
	| {code: 'const'; value: string}
	| {code: 'enum'}
	| {code: 'integer'}
	| {code: 'type'; expected: string}
	| {code: 'min_length' | 'max_length'; limit: number}
	| {code: 'min_graphemes' | 'max_graphemes'; limit: number}
	| {code: 'min_items' | 'max_items'; limit: number}
	| {code: 'minimum' | 'maximum'; limit: number}
	| {code: 'format'; format: string}
	| {code: 'union_member'}
	| {code: 'unresolved'; ref: string}

/** A field's errors, at its path in the record */
export type PathErrors = {path: (string | number)[]; errors: FieldError[]}

export type AnyObject = Record<string, unknown>

export function isObject(value: unknown): value is AnyObject {
	return typeof value === 'object' && value !== null && !Array.isArray(value)
}
