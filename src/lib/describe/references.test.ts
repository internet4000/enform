import {expect, test} from 'vitest'
import {exampleLexicon} from '#lib/lexicons/examples'
import type {LexiconDoc} from '#lib/lexicons/types'
import corpusRsvp from './corpus/lexicons/community.lexicon.calendar.rsvp.json' with {type: 'json'}
import corpusLike from './corpus/lexicons/app.bsky.feed.like.json' with {type: 'json'}
import {answersTo, referencesOf} from './references'

const type = (nsid: string, lexicon?: LexiconDoc) => ({
	nsid,
	lexicon: lexicon ?? exampleLexicon(nsid)
})
const eventApp = [type('example.event.event'), type('example.event.rsvp')]

test("an RSVP points at its app's event, as its description says", () => {
	expect(
		referencesOf('example.event.rsvp', exampleLexicon('example.event.rsvp'), eventApp)
	).toEqual([{field: 'subject', targets: ['example.event.event'], because: 'described'}])
})

test('records say it before words do', () => {
	const samples = [{subject: {uri: 'at://did:plc:x/other.app.thing/3k', cid: 'b'}}]
	expect(
		referencesOf('example.event.rsvp', exampleLexicon('example.event.rsvp'), eventApp, samples)[0]
	).toEqual({field: 'subject', targets: ['other.app.thing'], because: 'records'})
})

test('with no words for it: the one other type of its app', () => {
	const rsvp = corpusRsvp as LexiconDoc
	const event: LexiconDoc = {
		lexicon: 1,
		id: 'community.lexicon.calendar.event',
		defs: {main: {type: 'record', key: 'tid', record: {type: 'object', properties: {}}}}
	}
	const app = [type(event.id, event), type(rsvp.id, rsvp)]
	expect(referencesOf(rsvp.id, rsvp, app)[0]).toEqual({
		field: 'subject',
		targets: [event.id],
		because: 'app'
	})
})

test('nothing tells: no guess', () => {
	const like = corpusLike as LexiconDoc
	const post: LexiconDoc = {
		lexicon: 1,
		id: 'app.bsky.feed.post',
		defs: {main: {type: 'record', key: 'tid', record: {type: 'object', properties: {}}}}
	}
	const app = [
		type(like.id, like),
		type(post.id, post),
		type('app.bsky.graph.list', {...post, id: 'app.bsky.graph.list'})
	]
	expect(referencesOf(like.id, like, app).every((reference) => !reference.targets.length)).toBe(
		true
	)
})

test('an event is answered by an RSVP', () => {
	expect(answersTo('example.event.event', eventApp)).toEqual([
		{nsid: 'example.event.rsvp', field: 'subject', because: 'described'}
	])
	expect(answersTo('example.event.rsvp', eventApp)).toEqual([])
})
