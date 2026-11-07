import {expect, test} from 'vitest'
import type {LexNode} from '#lib/lexicons/types'
import {imageFields, richTextFields} from './patterns'

test('an image with alt text and an aspect ratio (Bluesky embed image shape)', () => {
	const node: LexNode = {
		type: 'object',
		properties: {
			image: {type: 'blob', accept: ['image/*']},
			alt: {type: 'string'},
			aspectRatio: {type: 'ref', ref: 'app.bsky.embed.defs#aspectRatio'}
		}
	}
	expect(imageFields(node)).toEqual({image: 'image', alt: 'alt', ratio: 'aspectRatio'})
})

test('a text with facets', () => {
	const node: LexNode = {
		type: 'object',
		properties: {
			text: {type: 'string'},
			facets: {type: 'array', items: {type: 'ref', ref: 'app.bsky.richtext.facet'}}
		}
	}
	expect(richTextFields(node)).toEqual({text: 'text', facets: 'facets'})
	expect(richTextFields({type: 'object', properties: {text: {type: 'string'}}})).toBeUndefined()
})
