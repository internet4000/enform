import {expect, test} from 'vitest'
import {reader, type ReaderItem} from './reader.svelte'

const item = (rkey: string): ReaderItem =>
	({
		repo: {did: 'did:plc:a'},
		record: {uri: `at://did:plc:a/x.y.z/${rkey}`, cid: rkey, collection: 'x.y.z', rkey, value: {}},
		href: rkey
	}) as unknown as ReaderItem

test('a deck not in front goes on to its next record when one ends', () => {
	reader.close()
	reader.start([item('a1'), item('a2')], 0, undefined, {key: 'a', name: 'A'})
	const first = reader.deck!
	reader.start([item('b1'), item('b2')], 0, undefined, {key: 'b', name: 'B'})
	expect(reader.deck).not.toBe(first)
	reader.ended(first)
	expect(first.index).toBe(1)
	// The deck in front stays where it was
	expect(reader.index).toBe(0)
	reader.close()
})
