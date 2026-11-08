import {describe, expect, it} from 'vitest'
import {movePin, parsePins, togglePin} from './pins'

describe('pins', () => {
	it('keeps domains only, once, lowercased', () => {
		expect(parsePins('["4000.radio","BSKY.app","4000.radio",3,"not a domain"]')).toEqual([
			'4000.radio',
			'bsky.app'
		])
		expect(parsePins('{')).toEqual([])
		expect(parsePins(null)).toEqual([])
	})

	it('pins at the end and unpins', () => {
		expect(togglePin(['a.com'], 'b.com')).toEqual(['a.com', 'b.com'])
		expect(togglePin(['a.com', 'b.com'], 'a.com')).toEqual(['b.com'])
	})

	it('moves within the list', () => {
		expect(movePin(['a.com', 'b.com', 'c.com'], 'c.com', -1)).toEqual(['a.com', 'c.com', 'b.com'])
		expect(movePin(['a.com', 'b.com'], 'a.com', -1)).toEqual(['a.com', 'b.com'])
		expect(movePin(['a.com', 'b.com'], 'b.com', 1)).toEqual(['a.com', 'b.com'])
	})
})
