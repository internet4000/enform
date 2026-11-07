import {expect, test} from 'vitest'
import {isStrongRef, refLabel, refType} from './union'

test('a main def is its bare NSID, others keep their #def', () => {
	expect(refType('app.bsky.embed.images', 'app.bsky.feed.post')).toBe('app.bsky.embed.images')
	expect(refType('#image', 'app.bsky.embed.images')).toBe('app.bsky.embed.images#image')
	expect(refType('a.b.c#main', 'x.y.z')).toBe('a.b.c')
})

test('labels name the def, or the last segment of a main def', () => {
	expect(refLabel('app.bsky.embed.recordWithMedia', 'x.y.z')).toBe('recordWithMedia')
	expect(refLabel('#mention', 'app.bsky.richtext.facet')).toBe('mention')
})

test('strong refs are recognized however they are written', () => {
	expect(isStrongRef('com.atproto.repo.strongRef', 'x.y.z')).toBe(true)
	expect(isStrongRef('com.atproto.repo.strongRef#main', 'x.y.z')).toBe(true)
	expect(isStrongRef('#main', 'com.atproto.repo.strongRef')).toBe(true)
	expect(isStrongRef('#other', 'x.y.z')).toBe(false)
})
