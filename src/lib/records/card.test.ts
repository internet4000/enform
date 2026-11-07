import {expect, test} from 'vitest'
import {recordCard} from './card'

const image = (cid: string) => ({$type: 'blob', ref: {$link: cid}, mimeType: 'image/jpeg', size: 1})

test('a Bluesky-like profile', () => {
	expect(
		recordCard({
			displayName: 'Alice',
			description: 'Hi there',
			avatar: image('a'),
			banner: image('b')
		})
	).toEqual({title: 'Alice', text: 'Hi there', avatar: 'a', banner: 'b'})
})

test('any image when none is named', () => {
	expect(recordCard({name: 'R', artwork: image('c')}).avatar).toBe('c')
})

test('the text is not the title again', () => {
	expect(recordCard({description: 'Only this'})).toEqual({
		title: 'Only this',
		text: undefined,
		avatar: undefined,
		banner: undefined
	})
})
