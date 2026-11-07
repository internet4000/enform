import {describe, expect, test} from 'vitest'
import {atUriPath, recordPath, searchPath} from './paths'

describe('searchPath', () => {
	test('handles, with or without @', () => {
		expect(searchPath('alice.bsky.social')).toBe('/@alice.bsky.social')
		expect(searchPath(' @Alice.Bsky.Social ')).toBe('/@alice.bsky.social')
	})
	test('DIDs', () => {
		expect(searchPath('did:plc:abc123')).toBe('/@did:plc:abc123')
	})
	test('at:// URIs to the repo, collection or record', () => {
		expect(searchPath('at://did:plc:abc/app.bsky.feed.post/3k')).toBe(
			'/@did:plc:abc/app.bsky.feed.post/3k'
		)
		expect(atUriPath('at://alice.test/app.bsky.feed.post')).toBe('/@alice.test/app.bsky.feed.post')
	})
	test('anything else is refused', () => {
		expect(searchPath('not a handle')).toBeUndefined()
		expect(searchPath('')).toBeUndefined()
	})
})

test('record keys are encoded', () => {
	expect(recordPath('alice.test', 'x.y.z', 'self')).toBe('/@alice.test/x.y.z/self')
	expect(recordPath('alice.test', 'x.y.z', 'a:b')).toBe('/@alice.test/x.y.z/a%3Ab')
})
