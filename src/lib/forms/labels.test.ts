import {expect, test} from 'vitest'
import {humanize} from './labels'

test('field names said in words', () => {
	expect(humanize('createdAt')).toBe('Created at')
	expect(humanize('aspectRatio')).toBe('Aspect ratio')
	expect(humanize('distance_units')).toBe('Distance units')
	expect(humanize('tags 2')).toBe('Tags 2')
})
