/**
 * The constraints a lexicon node puts on one value, checked as people type. Nested
 * values are checked by their own fields (see errors.ts for a whole record).
 */
import {unionMember} from '#lib/lexicons/refs'
import type {LexNode} from '#lib/lexicons/types'
import {isValidFormat} from './formats'
import {byteLength, graphemeLength} from './text'
import {isObject, type FieldError} from './types'

export type FieldContext = {
	/** Whether the enclosing object requires this value */
	required?: boolean
	/** NSID of the lexicon the node is in, for union members */
	base?: string
}

/** Whether a value counts as not given: absent, or an empty optional string or list */
export function isMissing(value: unknown): boolean {
	return value === undefined || value === null || (typeof value === 'number' && isNaN(value))
}

/** Whether an empty string stands for "nothing" here, rather than a valid empty value */
function emptyIsMissing(node: LexNode): boolean {
	return !!node.format || (node.minLength ?? 0) > 0 || (node.minGraphemes ?? 0) > 0
}

export function fieldErrors(
	node: LexNode,
	value: unknown,
	{required = false, base = ''}: FieldContext = {}
): FieldError[] {
	if (isMissing(value)) return required ? [{code: 'required'}] : []
	if (node.const !== undefined && value !== node.const) {
		return [{code: 'const', value: String(node.const)}]
	}
	switch (node.type) {
		case 'string':
			if (typeof value !== 'string') return [{code: 'type', expected: 'string'}]
			if (value === '') return required && emptyIsMissing(node) ? [{code: 'required'}] : []
			return stringErrors(node, value)
		case 'integer':
			if (typeof value !== 'number') return [{code: 'type', expected: 'integer'}]
			return integerErrors(node, value)
		case 'boolean':
			return typeof value === 'boolean' ? [] : [{code: 'type', expected: 'boolean'}]
		case 'array':
			if (!Array.isArray(value)) return [{code: 'type', expected: 'array'}]
			if (!required && value.length === 0) return []
			return arrayErrors(node, value)
		case 'object':
		case 'blob':
			return isObject(value) ? [] : [{code: 'type', expected: node.type}]
		case 'union':
			if (!isObject(value)) return [{code: 'type', expected: 'object'}]
			if (node.closed && !unionMember(node, value.$type, base)) return [{code: 'union_member'}]
			return []
		default:
			return []
	}
}

function stringErrors(node: LexNode, value: string): FieldError[] {
	const errors: FieldError[] = []
	if (node.enum && !node.enum.includes(value)) errors.push({code: 'enum'})
	if (node.format && !isValidFormat(node.format, value)) {
		errors.push({code: 'format', format: node.format})
	}
	const graphemes = node.maxGraphemes !== undefined || node.minGraphemes !== undefined
	const count = graphemes ? graphemeLength(value) : 0
	if (node.maxGraphemes !== undefined && count > node.maxGraphemes) {
		errors.push({code: 'max_graphemes', limit: node.maxGraphemes})
	} else if (node.minGraphemes !== undefined && count < node.minGraphemes) {
		errors.push({code: 'min_graphemes', limit: node.minGraphemes})
	}
	const bytes = byteLength(value)
	// Graphemes are what people count: only mention bytes when they are the limit hit
	if (node.maxLength !== undefined && bytes > node.maxLength && !errors.length) {
		errors.push({code: 'max_length', limit: node.maxLength})
	} else if (node.minLength !== undefined && bytes < node.minLength) {
		errors.push({code: 'min_length', limit: node.minLength})
	}
	return errors
}

function integerErrors(node: LexNode, value: number): FieldError[] {
	if (!Number.isInteger(value)) return [{code: 'integer'}]
	if (node.enum && !node.enum.includes(value)) return [{code: 'enum'}]
	if (node.minimum !== undefined && value < node.minimum) {
		return [{code: 'minimum', limit: node.minimum}]
	}
	if (node.maximum !== undefined && value > node.maximum) {
		return [{code: 'maximum', limit: node.maximum}]
	}
	return []
}

function arrayErrors(node: LexNode, value: unknown[]): FieldError[] {
	if (node.maxLength !== undefined && value.length > node.maxLength) {
		return [{code: 'max_items', limit: node.maxLength}]
	}
	if (node.minLength !== undefined && value.length < node.minLength) {
		return [{code: 'min_items', limit: node.minLength}]
	}
	return []
}
