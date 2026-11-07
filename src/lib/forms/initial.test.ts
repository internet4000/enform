import {expect, test} from 'vitest'
import {initialProperty, initialValue} from './initial'
import type {LexNode} from '#lib/lexicons/types'

const post: LexNode = {
	type: 'record',
	record: {
		type: 'object',
		required: ['text', 'createdAt', 'pinned'],
		properties: {
			text: {type: 'string', maxGraphemes: 300},
			createdAt: {type: 'string', format: 'datetime'},
			pinned: {type: 'boolean'},
			tags: {type: 'array', items: {type: 'string'}},
			embed: {type: 'union', refs: ['a.b.c']},
			reply: {type: 'ref', ref: '#replyRef'},
			count: {type: 'integer', default: 3},
			kind: {type: 'string', const: 'post'},
			draft: {type: 'boolean'}
		}
	}
}

test('a record starts from its object, empty but for defaults', () => {
	const value = initialValue(post, 'x.y.z') as Record<string, unknown>
	expect(value.text).toBe('')
	expect(value.tags).toEqual([])
	expect(value.count).toBe(3)
	expect(value.kind).toBe('post')
	expect(value.pinned).toBe(false)
	expect('embed' in value || 'reply' in value || 'draft' in value).toBe(false)
})

test('a required createdAt starts now', () => {
	const value = initialValue(post, 'x.y.z') as Record<string, string>
	expect(Math.abs(Date.parse(value.createdAt) - Date.now())).toBeLessThan(1000)
})

test('optional datetimes start empty', () => {
	expect(initialProperty('updatedAt', {type: 'string', format: 'datetime'}, false, 'x')).toBe('')
})

test('defaults are copies', () => {
	const node: LexNode = {type: 'array', default: ['a']}
	const value = initialValue(node, 'x') as string[]
	value.push('b')
	expect(node.default).toEqual(['a'])
})
