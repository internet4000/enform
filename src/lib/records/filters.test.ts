import {describe, expect, it} from 'vitest'
import type {LexNode} from '#lib/lexicons/types'
import type {RepoRecord} from '#lib/atproto/repo'
import {HAS, NONE, applyFilters, cleared, facetsOf, readFilters, sortsOf, toggled} from './filters'

const track: LexNode = {
	type: 'object',
	properties: {
		title: {type: 'string'},
		description: {type: 'string'},
		url: {type: 'string', format: 'uri'},
		mood: {type: 'string', knownValues: ['calm', 'loud']},
		tags: {type: 'array', items: {type: 'string'}},
		explicit: {type: 'boolean'},
		cover: {type: 'blob', accept: ['image/*']},
		plays: {type: 'integer'},
		subject: {type: 'string', format: 'did'},
		createdAt: {type: 'string', format: 'datetime'}
	}
}
const record = (rkey: string, value: Record<string, unknown>): RepoRecord => ({
	uri: `at://did:plc:a/radio.4000.track/${rkey}`,
	cid: rkey,
	collection: 'radio.4000.track',
	rkey,
	value
})
const records = [
	record('3', {
		title: 'Night drive',
		description: '#Techno at #night',
		url: 'https://www.youtube.com/watch?v=1',
		mood: 'calm',
		tags: ['ambient', 'night'],
		plays: 3,
		cover: {$type: 'blob', ref: {$link: 'bafy'}}
	}),
	record('2', {
		title: 'Morning',
		description: 'early #techno',
		url: 'https://soundcloud.com/a',
		mood: 'loud',
		tags: ['ambient'],
		explicit: true,
		plays: 10
	}),
	record('1', {title: 'Noon', url: 'https://youtube.com/watch?v=2', mood: 'calm', plays: 1})
]

describe('facetsOf', () => {
	const facets = facetsOf(track, records)
	const of = (key: string) => facets.find((facet) => facet.key === key)

	it('offers values, sites and presence, never titles, accounts or dates', () => {
		expect(facets.map((facet) => facet.key)).toEqual([
			'url',
			'mood',
			'tags',
			'explicit',
			'cover',
			'#'
		])
	})
	it('counts each value, most first', () => {
		expect(of('mood')?.values).toEqual([
			{value: 'calm', count: 2},
			{value: 'loud', count: 1}
		])
		expect(of('url')?.values[0]).toEqual({value: 'youtube.com', count: 2})
		expect(of('tags')?.values).toContainEqual({value: NONE, count: 1})
		expect(of('cover')?.values).toContainEqual({value: HAS, count: 1})
		// #tags in its texts, the ones on more than one record
		expect(of('#')?.values).toEqual([{value: 'techno', count: 2}])
	})
	it('finds #tags with no lexicon too', () => {
		expect(facetsOf(undefined, records)).toEqual([
			{key: '#', how: 'tag', values: [{value: 'techno', count: 2}]}
		])
	})
	it('leaves out what does not split the list', () => {
		const same = records.map((one) => record(one.rkey, {...one.value, mood: 'calm'}))
		expect(facetsOf(track, same).some((facet) => facet.key === 'mood')).toBe(false)
	})
})

describe('applyFilters', () => {
	const run = (search: string) =>
		applyFilters(track, records, readFilters(new URLSearchParams(search))).map((one) => one.rkey)

	it('keeps all, newest first, with no filter', () => expect(run('')).toEqual(['3', '2', '1']))
	it('searches every text, all words', () => {
		expect(run('q=night')).toEqual(['3'])
		expect(run('q=ambient morning')).toEqual(['2'])
	})
	it('filters by a value, a site, a tag, a presence', () => {
		expect(run('f.mood=calm')).toEqual(['3', '1'])
		expect(run('f.url=youtube.com')).toEqual(['3', '1'])
		expect(run('f.tags=ambient&f.mood=loud')).toEqual(['2'])
		expect(run(`f.cover=${HAS}`)).toEqual(['3'])
		expect(run(`f.explicit=${NONE}`)).toEqual(['3', '1'])
		expect(run(new URLSearchParams({'f.#': 'techno'}).toString())).toEqual(['3', '2'])
	})
	it('orders oldest first, or by a number', () => {
		expect(run('sort=oldest')).toEqual(['1', '2', '3'])
		expect(run('sort=plays')).toEqual(['2', '3', '1'])
	})
})

describe('sortsOf and the URL', () => {
	it('offers its own numbers and dates, not when it was made', () => {
		expect(sortsOf(track).map((sort) => sort.key)).toEqual(['newest', 'oldest', 'plays'])
	})
	it('toggles a filter and clears them all, keeping the rest', () => {
		const url = new URL('http://x/@a/apps/radio4000.com?type=radio.4000.track')
		const on = toggled(url, 'mood', 'calm')
		expect(on).toBe('/@a/apps/radio4000.com?type=radio.4000.track&f.mood=calm')
		expect(toggled(new URL(on, url), 'mood', 'calm')).toBe(
			'/@a/apps/radio4000.com?type=radio.4000.track'
		)
		expect(cleared(new URL(`${on}&q=a&sort=oldest`, url))).toBe(
			'/@a/apps/radio4000.com?type=radio.4000.track'
		)
	})
})
