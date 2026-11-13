import {describe, expect, test} from 'vitest'
import {addressOf, atUriAppPath, atUriPath, hrefOf, recordPath, searchPath} from './paths'

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
			'/data/@did:plc:abc/apps/bsky.app?type=app.bsky.feed.post&record=3k'
		)
		expect(atUriPath('at://alice.test/app.bsky.feed.post')).toBe(
			'/data/@alice.test/apps/bsky.app?type=app.bsky.feed.post'
		)
	})
	test('an at:// URI as its app shows it', () => {
		expect(atUriAppPath('at://alice.test/example.event.event/3k')).toBe(
			'/@alice.test/apps/event.example?type=example.event.event&record=3k'
		)
	})
	test('anything else is refused', () => {
		expect(searchPath('not a handle')).toBeUndefined()
		expect(searchPath('')).toBeUndefined()
	})
})

test('records as stored: the data view, at the app view address, keys encoded', () => {
	expect(recordPath('alice.test', 'x.y.z', 'self')).toBe(
		'/data/@alice.test/apps/y.x?type=x.y.z&record=self'
	)
	expect(recordPath('alice.test', 'x.y.z', 'a:b')).toBe(
		'/data/@alice.test/apps/y.x?type=x.y.z&record=a%3Ab'
	)
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
