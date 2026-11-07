import {expect, test} from 'vitest'
import {fieldErrors} from './constraints'
import type {LexNode} from '#lib/lexicons/types'

const codes = (node: LexNode, value: unknown, required = false) =>
	fieldErrors(node, value, {required, base: 'x.y.z'}).map((error) => error.code)

test('required only when missing', () => {
	expect(codes({type: 'integer'}, undefined, true)).toEqual(['required'])
	expect(codes({type: 'integer'}, undefined)).toEqual([])
	expect(codes({type: 'integer'}, NaN, true)).toEqual(['required'])
})

test('an empty required string is missing only when it could not be valid empty', () => {
	expect(codes({type: 'string'}, '', true)).toEqual([])
	expect(codes({type: 'string', minLength: 1}, '', true)).toEqual(['required'])
	expect(codes({type: 'string', format: 'uri'}, '', true)).toEqual(['required'])
	expect(codes({type: 'string', format: 'uri'}, '')).toEqual([])
})

test('graphemes count what people see, bytes only when they are the limit', () => {
	const node: LexNode = {type: 'string', maxGraphemes: 1, maxLength: 32}
	expect(codes(node, '👨‍👩‍👧‍👦')).toEqual([])
	expect(codes(node, 'ab')).toEqual(['max_graphemes'])
	expect(codes({type: 'string', maxLength: 3}, 'éé')).toEqual(['max_length'])
	expect(codes({type: 'string', minGraphemes: 2}, 'a')).toEqual(['min_graphemes'])
})

test('formats', () => {
	expect(codes({type: 'string', format: 'uri'}, 'nope')).toEqual(['format'])
	expect(codes({type: 'string', format: 'uri'}, 'https://example.com')).toEqual([])
	expect(codes({type: 'string', format: 'datetime'}, '2026-01-01T00:00:00.000Z')).toEqual([])
	expect(codes({type: 'string', format: 'datetime'}, '2026-01-01')).toEqual(['format'])
	expect(codes({type: 'string', format: 'did'}, 'did:plc:abc')).toEqual([])
	expect(codes({type: 'string', format: 'language'}, 'fr')).toEqual([])
	expect(codes({type: 'string', format: 'at-uri'}, 'at://did:plc:abc/a.b.c/1')).toEqual([])
})

test('enums and consts', () => {
	expect(codes({type: 'string', enum: ['a', 'b']}, 'c')).toEqual(['enum'])
	expect(codes({type: 'integer', enum: [1, 2]}, 2)).toEqual([])
	expect(codes({type: 'string', const: 'a'}, 'b')).toEqual(['const'])
})

test('integers', () => {
	expect(codes({type: 'integer', minimum: 0}, -1)).toEqual(['minimum'])
	expect(codes({type: 'integer', maximum: 255}, 256)).toEqual(['maximum'])
	expect(codes({type: 'integer'}, 1.5)).toEqual(['integer'])
	expect(fieldErrors({type: 'integer', maximum: 9}, 10)).toEqual([{code: 'maximum', limit: 9}])
})

test('arrays count items, optional empty ones are fine', () => {
	expect(codes({type: 'array', maxLength: 1}, [1, 2])).toEqual(['max_items'])
	expect(codes({type: 'array', minLength: 1}, [])).toEqual([])
	expect(codes({type: 'array', minLength: 1}, [], true)).toEqual(['min_items'])
})

test('closed unions take only their members', () => {
	const node: LexNode = {type: 'union', refs: ['#a'], closed: true}
	expect(codes(node, {$type: 'x.y.z#a'})).toEqual([])
	expect(codes(node, {$type: 'x.y.z#b'})).toEqual(['union_member'])
})

test('wrong types are flagged', () => {
	expect(codes({type: 'string'}, 3)).toEqual(['type'])
	expect(codes({type: 'boolean'}, 'yes')).toEqual(['type'])
})
