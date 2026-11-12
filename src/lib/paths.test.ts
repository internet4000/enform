import {describe, expect, test} from 'vitest'
import {addressOf, atUriPath, hrefOf, recordPath, searchPath} from './paths'

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

test('addresses are after #, the part a browser never sends', () => {
	const at = new URL('https://x.org/enform/#/@a/apps/bsky.app?type=app.bsky.feed.post')
	const address = addressOf(at)
	expect(address.pathname).toBe('/@a/apps/bsky.app')
	expect(address.searchParams.get('type')).toBe('app.bsky.feed.post')
	// (`#` before it in the app; unit tests check paths without it)
	expect(hrefOf(address)).toMatch(/\/@a\/apps\/bsky\.app\?type=app\.bsky\.feed\.post$/)
	expect(addressOf(new URL('https://x.org/enform/')).pathname).toBe('/')
})
