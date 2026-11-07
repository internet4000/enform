import {expect, test} from 'vitest'
import {recordErrors} from './errors'
import {post, resolve} from './fixtures'

const errors = (value: unknown) => recordErrors(post, value, 'test.feed.post', resolve)

test('a valid record has none', async () => {
	expect(await errors({text: '', createdAt: '2026-01-01T00:00:00.000Z', tags: ['a', '']})).toEqual(
		[]
	)
})

test('errors carry their path, through unions, arrays and refs', async () => {
	const found = await errors({
		text: 'a',
		count: -1,
		tags: ['a', 'b', 'c'],
		embed: {$type: 'test.embed.images', images: [{alt: 'x'}]},
		reply: {parent: {uri: 'nope', cid: ''}}
	})
	expect(found.map(({path, errors}) => [path.join('.'), errors[0].code])).toEqual([
		['createdAt', 'required'],
		['count', 'minimum'],
		['tags', 'max_items'],
		['embed.images.0.image', 'required'],
		['reply.parent.uri', 'format'],
		['reply.parent.cid', 'required']
	])
})
