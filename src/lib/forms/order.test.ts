import {expect, test} from 'vitest'
import {fieldOrder} from './order'

test('required first, titles before the rest, own timestamps apart, deprecated apart', () => {
	const order = fieldOrder({
		type: 'object',
		required: ['url', 'title', 'createdAt'],
		properties: {
			url: {type: 'string', format: 'uri'},
			links: {type: 'array', items: {type: 'string'}},
			title: {type: 'string'},
			duration: {type: 'integer'},
			createdAt: {type: 'string', format: 'datetime'},
			updatedAt: {type: 'string', format: 'datetime'},
			description: {type: 'string'},
			website: {type: 'string', description: 'Deprecated: use links instead.'},
			embed: {type: 'union', refs: []}
		}
	})
	expect(order).toEqual({
		fields: ['url', 'title', 'description', 'duration', 'links', 'embed'],
		automatic: ['createdAt', 'updatedAt'],
		deprecated: ['website']
	})
})

test('content dates (an event start) stay with the fields', () => {
	const order = fieldOrder({
		type: 'object',
		properties: {
			startsAt: {type: 'string', format: 'datetime'},
			createdAt: {type: 'string', format: 'datetime'}
		}
	})
	expect(order.fields).toEqual(['startsAt'])
	expect(order.automatic).toEqual(['createdAt'])
})
