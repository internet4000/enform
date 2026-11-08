import {expect, test} from 'vitest'
import type {LexiconDoc, LexNode} from '#lib/lexicons/types'
import {kindOf} from './kinds'

const doc = (properties: Record<string, LexNode>, key = 'tid'): LexiconDoc => ({
	lexicon: 1,
	id: 'a.b.c',
	defs: {main: {type: 'record', key, record: {type: 'object', properties}}}
})
const date = {type: 'string', format: 'datetime'}

test('the kinds of well-known shapes', () => {
	const profile = doc(
		{displayName: {type: 'string'}, avatar: {type: 'blob', accept: ['image/*']}},
		'literal:self'
	)
	const follow = doc({subject: {type: 'string', format: 'did'}, createdAt: date})
	const like = doc({subject: {type: 'ref', ref: 'com.atproto.repo.strongRef'}, createdAt: date})
	const post = doc({text: {type: 'string', maxGraphemes: 300}, createdAt: date})
	const track = doc({
		url: {type: 'string', format: 'uri'},
		title: {type: 'string'},
		createdAt: date
	})
	const photo = doc({photo: {type: 'blob', accept: ['image/jpeg']}, alt: {type: 'string'}})
	const status = doc({status: {type: 'string', maxGraphemes: 1}, createdAt: date})
	const event = doc({name: {type: 'string'}, startsAt: date, endsAt: date})
	const list = doc({name: {type: 'string'}, description: {type: 'string'}, createdAt: date})

	expect(kindOf(profile).kind).toBe('profile')
	expect(kindOf(follow)).toEqual({kind: 'follow', fields: {subject: 'subject'}})
	expect(kindOf(like).kind).toBe('reaction')
	expect(kindOf(post)).toEqual({kind: 'post', fields: {text: 'text', title: undefined}})
	expect(kindOf(track)).toEqual({
		kind: 'link',
		fields: {url: 'url', title: 'title', text: undefined}
	})
	expect(kindOf(photo).fields.image).toBe('photo')
	expect(kindOf(status)).toEqual({kind: 'status', fields: {value: 'status'}})
	expect(kindOf(event).fields.start).toBe('startsAt')
	expect(kindOf(list).kind).toBe('list')
	expect(kindOf(undefined).kind).toBe('thing')
	// An avatar dresses a list; a message to someone is a post
	const bskyList = doc({name: {type: 'string'}, avatar: {type: 'blob', accept: ['image/png']}})
	const message = doc({subject: {type: 'string', format: 'did'}, text: {type: 'string'}})
	expect(kindOf(bskyList).kind).toBe('list')
	expect(kindOf(message).kind).toBe('post')
})
