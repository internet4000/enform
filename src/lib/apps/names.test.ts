import {expect, test} from 'vitest'
import {appOf, isProfileName, namespaceOf, namespaceOfDomain, typeName} from './names'

test('apps and types from NSIDs', () => {
	expect(appOf('radio.4000.track')).toBe('4000.radio')
	expect(appOf('app.bsky.feed.post')).toBe('bsky.app')
	expect(namespaceOf('app.bsky.feed.post')).toBe('app.bsky')
	expect(typeName('radio.4000.chat.message')).toBe('chat message')
	expect(isProfileName('app.bsky.actor.profile')).toBe(true)
	expect(isProfileName('app.bsky.actor.status')).toBe(false)
})

test('an app namespace from its domain', () => {
	expect(namespaceOfDomain('4000.radio')).toBe('radio.4000')
	expect(namespaceOfDomain('bsky.app')).toBe('app.bsky')
})
