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

	it('names a record by its key when that is what names it, and only then', () => {
		const repo = record(
			'test.repo.declaration',
			{repo: {type: 'string', format: 'did'}, createdAt: {type: 'string', format: 'datetime'}},
			{key: 'any', description: 'A repository. Its record key is the slug of the repository.'}
		)
		const named = describeType(repo.id, {lexicon: repo})
		expect(named.roles.title).toBe('$key')
		expect(named.why).toContainEqual({about: 'title', rule: 'key-names-described', fields: []})

		const schema = record('test.lexicon.schema', {lexicon: {type: 'integer'}}, {key: 'nsid'})
		expect(describeType(schema.id, {lexicon: schema}).roles.title).toBe('$key')

		// A key the lexicon says nothing of, or a sequence (TIDs), names nothing
		const unsaid = record('test.repo.thing', {createdAt: {type: 'string'}}, {key: 'any'})
		expect(describeType(unsaid.id, {lexicon: unsaid}).roles.title).toBeUndefined()
		const value = {createdAt: '2026-01-01T00:00:00Z'}
		expect(
			describeType('test.repo.slug', {
				samples: [
					{rkey: 'site', value},
					{rkey: 'enform', value}
				]
			}).roles.title
		).toBe('$key')
		expect(
			describeType('test.repo.tid', {samples: [{rkey: '3m6fkq2xmsk2a', value}]}).roles.title
		).toBeUndefined()
		// Its own name comes first
		const titled = record('test.repo.named', {name: {type: 'string'}}, {key: 'nsid'})
		expect(describeType(titled.id, {lexicon: titled}).roles.title).toBe('name')
	})
})
