/**
 * How to show a value: from its lexicon node when there is one, else from the data
 * itself (the atproto data model marks blobs, links and bytes, and typed objects
 * carry their $type).
 */
import {unionMember} from '#lib/lexicons/refs'
import type {LexNode} from '#lib/lexicons/types'

export type Shape =
	| {type: 'ref'; ref: string}
	| {type: 'object'; node?: LexNode}
	| {type: 'array'; items?: LexNode}
	| {type: 'string'; format?: string}
	| {type: 'blob' | 'cid-link' | 'bytes' | 'integer' | 'boolean' | 'empty' | 'unknown'}

function isObject(value: unknown): value is Record<string, unknown> {
	return typeof value === 'object' && value !== null && !Array.isArray(value)
}

/** A string's format, guessed when no lexicon states it */
function guessFormat(value: string): string | undefined {
	if (value.startsWith('at://')) return 'at-uri'
	if (value.startsWith('did:')) return 'did'
	if (/^https?:\/\//.test(value)) return 'uri'
	if (/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}/.test(value) && !Number.isNaN(Date.parse(value))) {
		return 'datetime'
	}
	return undefined
}

/** From the data model alone. `typed` follows an object's $type to its lexicon. */
function inferShape(value: unknown, typed: boolean): Shape {
	if (value === null || value === undefined || value === '') return {type: 'empty'}
	if (Array.isArray(value)) return {type: 'array'}
	if (typeof value === 'string') return {type: 'string', format: guessFormat(value)}
	if (typeof value === 'number') return {type: 'integer'}
	if (typeof value === 'boolean') return {type: 'boolean'}
	if (!isObject(value)) return {type: 'unknown'}
	if (value.$type === 'blob') return {type: 'blob'}
	if ('$link' in value) return {type: 'cid-link'}
	if ('$bytes' in value) return {type: 'bytes'}
	if (typed && typeof value.$type === 'string') return {type: 'ref', ref: value.$type}
	return {type: 'object'}
}

export function shapeOf(
	value: unknown,
	node: LexNode | undefined,
	base: string,
	typed = true
): Shape {
	if (value === null || value === undefined) return {type: 'empty'}
	switch (node?.type) {
		case 'ref':
			return node.ref ? {type: 'ref', ref: node.ref} : inferShape(value, typed)
		case 'union': {
			const $type = isObject(value) ? value.$type : undefined
			const member = unionMember(node, $type, base)
			if (member) return {type: 'ref', ref: member}
			// An open union can hold types it doesn't list: follow the value's own $type
			return inferShape(value, typed)
		}
		case 'object':
			return isObject(value) ? {type: 'object', node} : inferShape(value, false)
		case 'array':
			return Array.isArray(value) ? {type: 'array', items: node.items} : inferShape(value, false)
		case 'string':
			return typeof value === 'string'
				? {type: 'string', format: node.format}
				: inferShape(value, false)
		case 'blob':
		case 'cid-link':
		case 'bytes':
		case 'integer':
		case 'boolean':
			return {type: node.type}
		default:
			return inferShape(value, typed)
	}
}

/** An object's keys to show: the lexicon's order first, then any extra ones */
export function objectKeys(value: Record<string, unknown>, node?: LexNode): string[] {
	const declared = Object.keys(node?.properties ?? {}).filter((key) => key in value)
	const extra = Object.keys(value).filter((key) => key !== '$type' && !declared.includes(key))
	return [...declared, ...extra]
}
