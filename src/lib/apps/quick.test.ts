import {describe, expect, it} from 'vitest'
import type {LexiconDoc} from '#lib/lexicons/types'
import type {AppType, RepoApp} from './types'
import {quickActions} from './quick'

const record = (
	id: string,
	properties: Record<string, object>,
	required: string[] = []
): LexiconDoc =>
	({
		lexicon: 1,
		id,
		defs: {main: {type: 'record', key: 'tid', record: {type: 'object', required, properties}}}
	}) as LexiconDoc

const follow = record(
	'app.bsky.graph.follow',
	{subject: {type: 'string', format: 'did'}, createdAt: {type: 'string', format: 'datetime'}},
	['subject', 'createdAt']
)
const block = record(
	'app.bsky.graph.block',
	{subject: {type: 'string', format: 'did'}, createdAt: {type: 'string', format: 'datetime'}},
	['subject', 'createdAt']
)
const listitem = record(
	'app.bsky.graph.listitem',
	{subject: {type: 'string', format: 'did'}, list: {type: 'string', format: 'at-uri'}},
	['subject', 'list']
)
const post = record('app.bsky.feed.post', {
	text: {type: 'string'},
	facets: {type: 'array', items: {type: 'ref', ref: 'app.bsky.richtext.facet'}},
	createdAt: {type: 'string', format: 'datetime'}
})
const message = record(
	'radio.4000.chat.message',
	{
		subject: {type: 'string', format: 'did'},
		text: {type: 'string'},
		createdAt: {type: 'string', format: 'datetime'}
	},
	['subject', 'text', 'createdAt']
)
const track = record('radio.4000.track', {
	title: {type: 'string'},
	url: {type: 'string', format: 'uri'}
})

const type = (lexicon: LexiconDoc, used = false): AppType => ({
	nsid: lexicon.id,
	name: lexicon.id.split('.').pop()!,
	kind: 'list' as AppType['kind'],
	lexicon,
	used
})
const app = (namespace: string, lists: AppType[]): RepoApp => ({
	app: namespace.split('.').reverse().join('.'),
	namespace,
	lists,
	singles: [],
	published: true
})

describe('quickActions', () => {
	it('offers what one makes, used types first, never what needs a target', () => {
		const apps = [
			app('radio.4000', [type(message), type(track, true)]),
			app('app.bsky', [type(follow), type(post)])
		]
		expect(quickActions(apps).map((a) => a.type.nsid)).toEqual([
			'radio.4000.track',
			'app.bsky.feed.post'
		])
	})
})
