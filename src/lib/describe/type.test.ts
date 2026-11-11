import {describe, expect, it} from 'vitest'
import type {LexiconDoc} from '#lib/lexicons/types'
import {describeType} from './type'

const record = (
	id: string,
	properties: LexiconDoc['defs'][string]['properties'],
	more: Partial<LexiconDoc['defs'][string]> = {},
	defs: LexiconDoc['defs'] = {}
): LexiconDoc => ({
	lexicon: 1,
	id,
	defs: {main: {type: 'record', key: 'tid', record: {type: 'object', properties}, ...more}, ...defs}
})

describe('describeType', () => {
	it('follows refs to the same lexicon to see what a subject points at', () => {
		const star = record(
			'test.feed.star',
			{subject: {type: 'union', refs: ['#repo', '#record']}},
			{},
			{
				repo: {type: 'object', properties: {identity: {type: 'string', format: 'did'}}},
				record: {
					type: 'object',
					properties: {record: {type: 'ref', ref: 'com.atproto.repo.strongRef'}}
				}
			}
		)
		const described = describeType(star.id, {lexicon: star})
		expect(described.kind).toBe('reaction')
		expect(described.points).toEqual({accounts: ['subject'], records: ['subject']})
	})

	it('reads a follow keyed by the account it follows, as its lexicon says or its keys show', () => {
		const said = record(
			'test.graph.follow',
			{createdAt: {type: 'string', format: 'datetime'}},
			{
				key: 'any',
				description: "A follow, with the subject's DID as rkey."
			}
		)
		expect(describeType(said.id, {lexicon: said})).toMatchObject({
			kind: 'follow',
			roles: {subject: '$key'},
			points: {accounts: ['$key']}
		})
		const shown = describeType('test.graph.follow', {
			samples: [{rkey: 'did:plc:abc', value: {createdAt: '2025-01-01T00:00:00Z'}}]
		})
		expect(shown.kind).toBe('follow')
	})

	it('tells a block from a follow, by its name or its description', () => {
		const block = record('test.graph.block', {subject: {type: 'string', format: 'did'}})
		const blocked = describeType(block.id, {lexicon: block})
		expect(blocked.kind).toBe('block')
		expect(blocked.why[0]).toMatchObject({about: 'kind', rule: 'against-account'})
		const muted = record(
			'test.graph.quiet',
			{subject: {type: 'string', format: 'did'}},
			{
				description: 'Mutes an account.'
			}
		)
		expect(describeType(muted.id, {lexicon: muted}).kind).toBe('block')
		const follow = record('test.graph.follow', {subject: {type: 'string', format: 'did'}})
		expect(describeType(follow.id, {lexicon: follow}).kind).toBe('follow')
	})

	it('reads a title and a long text as an article, a title and a line as a list', () => {
		const article = record('test.blog.entry', {
			title: {type: 'string'},
			content: {type: 'string', maxLength: 100000}
		})
		expect(describeType(article.id, {lexicon: article})).toMatchObject({
			kind: 'post',
			roles: {title: 'title', text: 'content'}
		})
		const list = record('test.graph.list', {
			name: {type: 'string'},
			description: {type: 'string', maxGraphemes: 300}
		})
		expect(describeType(list.id, {lexicon: list}).kind).toBe('list')
	})
})
