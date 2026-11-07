/**
 * A form's value as the record to write: empty optional fields dropped, integers whole,
 * datetimes in ISO 8601, and $type on the record and on union members, as the atproto
 * data model wants them. Fields the lexicon doesn't declare are kept untouched.
 */
import {isValidDatetime} from '@atproto/syntax'
import {resolveRef, unionMember} from '#lib/lexicons/refs'
import type {LexNode} from '#lib/lexicons/types'
import {refType} from './union'
import {isObject, type AnyObject, type Resolver} from './types'

/** Whether a cleaned optional value says nothing and can be left out */
function isEmpty(value: unknown): boolean {
	if (value === '' || (Array.isArray(value) && value.length === 0)) return true
	return isObject(value) && Object.keys(value).length === 0
}

export async function cleanValue(
	node: LexNode,
	value: unknown,
	base: string,
	resolve: Resolver = resolveRef
): Promise<unknown> {
	if (value === undefined) return undefined
	switch (node.type) {
		case 'record': {
			const record = node.record ? await cleanValue(node.record, value, base, resolve) : value
			return typed(base, record)
		}
		case 'object':
			return isObject(value) ? cleanObject(node, value, base, resolve) : value
		case 'array':
			return Array.isArray(value) ? cleanArray(node, value, base, resolve) : value
		case 'string':
			return cleanString(node, value)
		case 'integer':
			return cleanInteger(value)
		case 'ref':
			return cleanRef(node.ref ?? '', value, base, resolve)
		case 'union':
			return cleanUnion(node, value, base, resolve)
		default:
			// booleans, blobs and the data model's own types (cid-link, bytes, unknown)
			return value
	}
}

async function cleanObject(
	node: LexNode,
	value: AnyObject,
	base: string,
	resolve: Resolver
): Promise<AnyObject> {
	const result: AnyObject = {}
	for (const [key, item] of Object.entries(value)) {
		const child = node.properties?.[key]
		if (!child) {
			if (item !== undefined) result[key] = item
			continue
		}
		if (item === null && node.nullable?.includes(key)) {
			result[key] = null
			continue
		}
		const cleaned = await cleanValue(child, item ?? undefined, base, resolve)
		if (cleaned === undefined) continue
		if (!node.required?.includes(key) && isEmpty(cleaned)) continue
		result[key] = cleaned
	}
	return result
}

async function cleanArray(
	node: LexNode,
	value: unknown[],
	base: string,
	resolve: Resolver
): Promise<unknown[]> {
	if (!node.items) return value
	const items = await Promise.all(
		value.map((item) => cleanValue(node.items as LexNode, item, base, resolve))
	)
	// Empty rows of a list of strings are blanks left in the form, not values
	return items.filter((item) => item !== undefined && item !== '')
}

function cleanString(node: LexNode, value: unknown): unknown {
	if (typeof value !== 'string' || node.format !== 'datetime' || !value) return value
	if (isValidDatetime(value)) return value
	const time = Date.parse(value)
	return Number.isNaN(time) ? value : new Date(time).toISOString()
}

function cleanInteger(value: unknown): unknown {
	const number = typeof value === 'string' && value.trim() ? Number(value) : value
	if (typeof number !== 'number') return value === '' || value === null ? undefined : value
	return Number.isFinite(number) ? Math.trunc(number) : undefined
}

async function cleanRef(
	ref: string,
	value: unknown,
	base: string,
	resolve: Resolver
): Promise<unknown> {
	const target = await resolve(ref, base)
	if (!target) return value
	if (target.node.type === 'token') return value
	const node = target.node.type === 'record' ? target.node.record : target.node
	return node ? cleanValue(node, value, target.nsid, resolve) : value
}

async function cleanUnion(
	node: LexNode,
	value: unknown,
	base: string,
	resolve: Resolver
): Promise<unknown> {
	if (!isObject(value)) return value
	const member = unionMember(node, value.$type, base)
	// An open union may hold a type it doesn't list: keep it as it is
	if (!member) return value
	const cleaned = await cleanRef(member, value, base, resolve)
	return typed(refType(member, base), cleaned)
}

/** An object with its $type first */
function typed($type: string, value: unknown): AnyObject {
	const {$type: _, ...rest} = value as AnyObject
	return {$type, ...rest}
}
