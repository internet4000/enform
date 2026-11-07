import {expect, test} from 'vitest'
import {appOf, groupByApp} from './collections'

test('collections are grouped by the app (domain) that defines them', () => {
	expect(groupByApp(['radio.4000.track', 'app.bsky.feed.post', 'app.bsky.actor.profile'])).toEqual([
		{app: 'bsky.app', collections: ['app.bsky.actor.profile', 'app.bsky.feed.post']},
		{app: '4000.radio', collections: ['radio.4000.track']}
	])
	expect(appOf('com.atproto.lexicon.schema')).toBe('atproto.com')
})
