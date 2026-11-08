import {expect, test} from 'vitest'
import {capabilitiesOf, plays} from './detect'

const image = (cid: string) => ({$type: 'blob', ref: {$link: cid}, mimeType: 'image/jpeg', size: 1})

test('a track with a YouTube link plays', () => {
	const found = capabilitiesOf({url: 'https://www.youtube.com/watch?v=WlpNBW-QbX8', title: 'x'})
	expect(found[0]).toEqual({
		kind: 'media',
		url: 'https://www.youtube.com/watch?v=WlpNBW-QbX8',
		player: 'youtube'
	})
	expect(plays(found)).toBe(true)
})

test('a post: its text, its embed images with their alt, its other links', () => {
	const found = capabilitiesOf({
		text: 'hello',
		embed: {images: [{image: image('a'), alt: 'A cat'}]},
		facets: [{features: [{uri: 'https://example.com/page'}]}]
	})
	expect(found.map((c) => c.kind)).toEqual(['images', 'text', 'link'])
	expect(found[0]).toEqual({kind: 'images', cids: ['a'], alts: ['A cat']})
	expect(plays(found)).toBe(false)
})

test('a place, from latitude and longitude as strings or numbers', () => {
	expect(
		capabilitiesOf({location: {latitude: '52.52', longitude: '13.40', name: 'Berlin'}})
	).toEqual([{kind: 'place', latitude: 52.52, longitude: 13.4, name: 'Berlin'}])
	expect(capabilitiesOf({geo: {lat: 200, lng: 0}})).toEqual([])
})

test('an audio file, by link or as a blob', () => {
	expect(capabilitiesOf({url: 'https://x.test/song.mp3'})[0]).toMatchObject({
		kind: 'media',
		player: 'audio'
	})
	expect(
		capabilitiesOf({file: {$type: 'blob', ref: {$link: 'v'}, mimeType: 'video/mp4'}})[0]
	).toEqual({
		kind: 'blob-media',
		cid: 'v',
		player: 'video'
	})
})
