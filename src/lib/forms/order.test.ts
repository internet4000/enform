import {expect, test} from 'vitest'
import {fieldOrder} from './order'

test('required first, titles before the rest, timestamps last, deprecated apart', () => {
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
		fields: ['url', 'title', 'description', 'duration', 'links', 'embed', 'createdAt', 'updatedAt'],
		deprecated: ['website']
	})
})
