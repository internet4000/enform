import {expect, test} from 'vitest'
import type {LexiconDoc} from '#lib/lexicons/types'
import {carried, relatedTypes} from './related'
import type {RepoApp} from './types'

const lexicon = (
	id: string,
	properties: Record<string, {type: string; format?: string}>
): LexiconDoc => ({
	lexicon: 1,
	id,
	defs: {main: {type: 'record', key: 'tid', record: {type: 'object', properties}}}
})

const radioTrack = lexicon('radio.4000.track', {
	url: {type: 'string', format: 'uri'},
	title: {type: 'string'},
	updatedAt: {type: 'string', format: 'datetime'},
	description: {type: 'string'},
	createdAt: {type: 'string', format: 'datetime'}
})

const apps: RepoApp[] = [
	{
		app: '4000.radio',
		namespace: 'radio.4000',
		lists: [
			{nsid: 'radio.4000.track', name: 'track', kind: 'list', lexicon: radioTrack, used: false}
		],
		singles: [],
		published: true
	}
]

test('a record without a lexicon fits a type of the same name sharing fields', () => {
	const value = {
		url: 'https://x.test',
		title: 'Song',
		createdAt: '2026-01-01T00:00:00Z',
		updatedAt: '2026-01-02T00:00:00Z'
	}
	const [related] = relatedTypes('com.radio4000.track', undefined, value, apps)
	expect(related.type.nsid).toBe('radio.4000.track')
	expect(related.fields).toEqual(['url', 'title'])
	expect(carried(value, related.fields)).toEqual({url: 'https://x.test', title: 'Song'})
})

test('no suggestion for another name, the same type, or no shared field', () => {
	expect(relatedTypes('a.b.post', undefined, {url: 'x'}, apps)).toEqual([])
	expect(relatedTypes('radio.4000.track', radioTrack, undefined, apps)).toEqual([])
	expect(relatedTypes('a.b.track', undefined, {color: 'red'}, apps)).toEqual([])
})

test('kinds must match: a number is not a string', () => {
	expect(relatedTypes('a.b.track', undefined, {title: 3}, apps)).toEqual([])
})
