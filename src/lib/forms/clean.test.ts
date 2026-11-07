import {expect, test} from 'vitest'
import {cleanValue} from './clean'
import {post, resolve} from './fixtures'

const clean = (value: unknown) => cleanValue(post, value, 'test.feed.post', resolve)

const blob = {$type: 'blob', ref: {$link: 'bafkrei'}, mimeType: 'image/png', size: 3}

test('the record gets its collection as $type, empty optional fields go', async () => {
	expect(
		await clean({text: '', createdAt: '2026-01-01T00:00:00.000Z', tags: [], count: NaN})
	).toEqual({$type: 'test.feed.post', text: '', createdAt: '2026-01-01T00:00:00.000Z'})
})

test('integers are whole numbers, datetimes ISO strings', async () => {
	const value = (await clean({text: 'a', createdAt: '2026-01-01T10:00', count: 2.7})) as Record<
		string,
		unknown
	>
	expect(value.count).toBe(2)
	expect(value.createdAt).toBe(new Date('2026-01-01T10:00').toISOString())
})

test('blank rows of string lists go', async () => {
	const value = (await clean({text: 'a', createdAt: 'x', tags: ['one', '', 'two']})) as {
		tags: string[]
	}
	expect(value.tags).toEqual(['one', 'two'])
})

test('union members get their full $type, through refs, blobs as they are', async () => {
	const value = (await clean({
		text: 'a',
		createdAt: 'x',
		embed: {$type: 'test.embed.images', images: [{alt: '', image: blob}]}
	})) as {embed: unknown}
	expect(value.embed).toEqual({$type: 'test.embed.images', images: [{alt: '', image: blob}]})
	const external = (await clean({
		text: 'a',
		createdAt: 'x',
		embed: {$type: '#external', uri: 'https://a.b', title: ''}
	})) as {embed: unknown}
	expect(external.embed).toEqual({$type: 'test.feed.post#external', uri: 'https://a.b'})
})

test('unknown types in open unions and undeclared fields are kept', async () => {
	const value = (await clean({
		text: 'a',
		createdAt: 'x',
		embed: {$type: 'other.thing', any: 1},
		extra: {a: [1]},
		future: 'kept'
	})) as Record<string, unknown>
	expect(value.embed).toEqual({$type: 'other.thing', any: 1})
	expect(value.extra).toEqual({a: [1]})
	expect(value.future).toBe('kept')
})

test('refs to objects drop their own empty fields, and empty optional objects go', async () => {
	const value = (await clean({
		text: 'a',
		createdAt: 'x',
		reply: {parent: {uri: 'at://did:plc:a/b.c.d/e', cid: 'bafy'}}
	})) as Record<string, unknown>
	expect(value.reply).toEqual({parent: {uri: 'at://did:plc:a/b.c.d/e', cid: 'bafy'}})
	const empty = (await clean({text: 'a', createdAt: 'x', reply: {}})) as Record<string, unknown>
	expect('reply' in empty).toBe(false)
})

test('refs to strings and tokens stay strings', async () => {
	const value = (await clean({text: 'a', createdAt: 'x', purpose: 'test.feed.post#modlist'})) as {
		purpose: string
	}
	expect(value.purpose).toBe('test.feed.post#modlist')
})
