import {expect, test} from 'vitest'
import {groupByAuthority} from './collections'

test('collections are grouped by the domain that defines them', () => {
	expect(
		groupByAuthority(['radio.4000.track', 'app.bsky.feed.post', 'app.bsky.feed.like'])
	).toEqual([
		{authority: 'feed.bsky.app', collections: ['app.bsky.feed.like', 'app.bsky.feed.post']},
		{authority: '4000.radio', collections: ['radio.4000.track']}
	])
})
