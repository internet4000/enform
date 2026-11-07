import {expect, test} from 'vitest'
import {objectKeys, shapeOf} from './shape'

const blob = {$type: 'blob', ref: {$link: 'bafy'}, mimeType: 'image/png', size: 3}

test('lexicon nodes decide', () => {
	expect(shapeOf('2026-01-01', {type: 'string', format: 'datetime'}, 'a.b.c')).toEqual({
		type: 'string',
		format: 'datetime'
	})
	expect(shapeOf({x: 1}, {type: 'ref', ref: '#thing'}, 'a.b.c')).toEqual({
		type: 'ref',
		ref: '#thing'
	})
})

test('union members are matched by $type, relative refs included', () => {
	const union = {type: 'union', refs: ['#image', 'x.y.z#video']}
	expect(shapeOf({$type: 'a.b.c#image'}, union, 'a.b.c')).toEqual({type: 'ref', ref: '#image'})
	expect(shapeOf({$type: 'x.y.z#video'}, union, 'a.b.c')).toEqual({type: 'ref', ref: 'x.y.z#video'})
	// open union, unlisted type: follow its own $type
	expect(shapeOf({$type: 'q.r.s'}, union, 'a.b.c')).toEqual({type: 'ref', ref: 'q.r.s'})
})

test('without a lexicon, the data model tells', () => {
	expect(shapeOf(blob, undefined, 'a.b.c')).toEqual({type: 'blob'})
	expect(shapeOf({$link: 'bafy'}, undefined, 'a.b.c')).toEqual({type: 'cid-link'})
	expect(shapeOf('at://did:plc:x/a.b.c/1', undefined, 'a.b.c')).toEqual({
		type: 'string',
		format: 'at-uri'
	})
	expect(shapeOf({$type: 'q.r.s', a: 1}, undefined, 'a.b.c', false)).toEqual({type: 'object'})
})

test('object keys follow the lexicon, then extras, never $type', () => {
	const node = {type: 'object', properties: {b: {type: 'string'}, a: {type: 'string'}}}
	expect(objectKeys({$type: 't', a: 1, z: 2, b: 3}, node)).toEqual(['b', 'a', 'z'])
})
