import {expect, test} from 'vitest'
import {detect, facets} from './richtext'

test('links, tags and mentions, trailing punctuation left out', () => {
	expect(detect('see https://x.test/a, #radio and @alice.test.').map((f) => f.text)).toEqual([
		'https://x.test/a',
		'#radio',
		'@alice.test'
	])
})

test('numbers are not tags', () => {
	expect(detect('#1 #2026')).toEqual([])
})

test('byte ranges count UTF-8 bytes, not characters', async () => {
	const text = 'é #tag'
	const [facet] = await facets(text, async () => undefined)
	expect(facet.index).toEqual({byteStart: 3, byteEnd: 7})
	expect(facet.features[0]).toEqual({$type: 'app.bsky.richtext.facet#tag', tag: 'tag'})
})

test('mentions become their DID, or are left out', async () => {
	const resolved = await facets('hi @alice.test', async () => 'did:plc:alice')
	expect(resolved[0].features[0]).toEqual({
		$type: 'app.bsky.richtext.facet#mention',
		did: 'did:plc:alice'
	})
	expect(await facets('hi @nobody.test', async () => undefined)).toEqual([])
})
