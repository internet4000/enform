import {expect, test} from 'vitest'
import type {LexNode} from '#lib/lexicons/types'
import {enrichment, linkFields} from './enrich'

const track: LexNode = {
	type: 'object',
	properties: {
		url: {type: 'string', format: 'uri'},
		title: {type: 'string', maxGraphemes: 10},
		description: {type: 'string'}
	}
}

const details = {
	url: 'https://x.test',
	title: 'A long page title',
	description: 'About',
	site: 'x.test',
	media: false
}

test('link fields are strings declared as URIs', () => {
	expect(linkFields(track)).toEqual(['url'])
})

test('empty title and description take the link details, within limits', () => {
	expect(enrichment(track, {url: 'https://x.test'}, details, {})).toEqual({
		title: 'A long pa…',
		description: 'About'
	})
})

test('what someone typed stays; what was filled before is replaced', () => {
	expect(enrichment(track, {title: 'Mine'}, details, {})).toEqual({description: 'About'})
	expect(enrichment(track, {title: 'Old', description: 'x'}, details, {title: 'Old'})).toEqual({
		title: 'A long pa…'
	})
})

test("a media link's author isn't a description", () => {
	expect(enrichment(track, {}, {...details, media: true}, {})).toEqual({title: 'A long pa…'})
})
