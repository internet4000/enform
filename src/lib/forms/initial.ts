/**
 * A form's starting value for a lexicon node: its const or default when it has one,
 * else empty. Optional objects, refs, unions and blobs start absent, to be added on purpose.
 */
import type {LexNode} from '#lib/lexicons/types'
import type {AnyObject} from './types'

/** Timestamps a record usually stamps itself with, like createdAt */
const STAMP = /^(created|indexed|published|recorded|saved)At$/

export function initialValue(node: LexNode, base: string): unknown {
	if (node.const !== undefined) return node.const
	if (node.default !== undefined) return structuredClone(node.default)
	switch (node.type) {
		case 'record':
			return node.record ? initialValue(node.record, base) : {}
		case 'object':
			return initialObject(node, base)
		case 'string':
			return ''
		case 'array':
			return []
		default:
			return undefined
	}
}

/** A property's starting value, knowing whether its object requires it */
export function initialProperty(
	key: string,
	node: LexNode,
	required: boolean,
	base: string
): unknown {
	if (node.const !== undefined || node.default !== undefined) return initialValue(node, base)
	if (required) {
		if (node.type === 'boolean') return false
		if (node.type === 'string' && node.format === 'datetime' && STAMP.test(key)) {
			return new Date().toISOString()
		}
		return initialValue(node, base)
	}
	if (['object', 'ref', 'union', 'blob', 'unknown', 'cid-link', 'bytes'].includes(node.type)) {
		return undefined
	}
	return initialValue(node, base)
}

function initialObject(node: LexNode, base: string): AnyObject {
	const value: AnyObject = {}
	for (const [key, child] of Object.entries(node.properties ?? {})) {
		const initial = initialProperty(key, child, !!node.required?.includes(key), base)
		if (initial !== undefined) value[key] = initial
	}
	return value
}
