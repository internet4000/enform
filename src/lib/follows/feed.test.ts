import {beforeEach, expect, test, vi} from 'vitest'

vi.mock('#lib/atproto/identity', () => ({
	resolveIdentity: async (did: string) => ({did, pds: 'https://pds.test'})
}))
vi.mock('#lib/atproto/repo', () => ({
	listRecords: async (repo: {did: string}, collection: string) => ({
		records: [1, 2].map((n) => ({
			uri: `at://${repo.did}/${collection}/${n}`,
			cid: `c${n}`,
			value: {createdAt: `2026-01-0${n}${repo.did.endsWith('b') ? '' : ''}T00:00:00Z`}
		}))
	})
}))

const {followingFeed} = await import('./feed')

beforeEach(() => vi.clearAllMocks())

test('followed collections, newest first; whole-repo follows add nothing', async () => {
	const feed = await followingFeed(
		[
			{rkey: '1', cid: 'x', subject: 'did:plc:a', collection: 'a.b.c'},
			{rkey: '2', cid: 'y', subject: 'did:plc:b'}
		],
		10
	)
	expect(feed.map((item) => item.record.uri)).toEqual([
		'at://did:plc:a/a.b.c/2',
		'at://did:plc:a/a.b.c/1'
	])
})
