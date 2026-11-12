import {describe, expect, it} from 'vitest'
import type {LexiconDoc} from '#lib/lexicons/types'
import {recordActions} from './actions'

const doc = (id: string, properties: Record<string, object>): LexiconDoc =>
	({
		lexicon: 1,
		id,
		defs: {main: {type: 'record', key: 'tid', record: {type: 'object', properties}}}
	}) as LexiconDoc

const verbs = (value: Record<string, unknown>, lexicon: LexiconDoc) =>
	recordActions(value, lexicon).map((action) => action.verb)

describe('recordActions', () => {
	it('plays a track, and reads nothing else of it', () => {
		const track = doc('radio.4000.track', {
			url: {type: 'string', format: 'uri'},
			title: {type: 'string'},
			description: {type: 'string'}
		})
		expect(
			verbs(
				{url: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ', title: 'A', description: 'B'},
				track
			)
		).toEqual(['play'])
	})
	it('reads a post', () => {
		const post = doc('app.bsky.feed.post', {text: {type: 'string'}})
		expect(verbs({text: 'Hello'}, post)).toEqual(['read'])
	})
	it('opens the reader once, as the most telling verb', () => {
		const profile = doc('app.bsky.actor.profile', {
			displayName: {type: 'string'},
			description: {type: 'string'},
			avatar: {type: 'blob', accept: ['image/*']}
		})
		const avatar = {$type: 'blob', ref: {$link: 'bafy'}, mimeType: 'image/png', size: 1}
		expect(verbs({displayName: 'A', description: 'B', avatar}, profile)).toEqual(['view'])
	})
	it('goes to the account followed', () => {
		const follow = doc('app.bsky.graph.follow', {subject: {type: 'string', format: 'did'}})
		expect(recordActions({subject: 'did:plc:alice'}, follow)).toEqual([
			{verb: 'account', did: 'did:plc:alice', field: 'subject'}
		])
	})
	it('goes to the record liked, by its strongRef', () => {
		const like = doc('app.bsky.feed.like', {
			subject: {type: 'ref', ref: 'com.atproto.repo.strongRef'}
		})
		const uri = 'at://did:plc:bob/app.bsky.feed.post/3abc'
		expect(recordActions({subject: {uri, cid: 'x'}}, like)).toEqual([
			{verb: 'record', uri, collection: 'app.bsky.feed.post', field: 'subject'}
		])
	})
	it('has no action for a record with nothing to show or follow', () => {
		const thing = doc('x.y.thing', {count: {type: 'integer'}})
		expect(verbs({count: 1}, thing)).toEqual([])
	})
})
