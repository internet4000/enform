import {describe, expect, it} from 'vitest'
import {movePin, parsePins, pinKey, pinsStorageKey, readPin, togglePin} from './pins'

describe('pins', () => {
	it('keeps domains only, once, lowercased', () => {
		expect(parsePins('["4000.radio","BSKY.app","4000.radio",3,"not a domain"]')).toEqual([
			'4000.radio',
			'bsky.app'
		])
		expect(parsePins('{')).toEqual([])
		expect(parsePins(null)).toEqual([])
	})

	it('pins profiles in apps by their DID, so a new handle keeps them', () => {
		const pins = parsePins('["did:plc:abc/4000.Radio","bob.test/4000.radio","did:plc:abc/x"]')
		expect(pins).toEqual(['did:plc:abc/4000.radio'])
		expect(readPin(pins[0])).toEqual({did: 'did:plc:abc', domain: '4000.radio'})
		expect(readPin('4000.radio')).toEqual({domain: '4000.radio', did: undefined})
		expect(pinKey({did: 'did:plc:abc', domain: '4000.radio'})).toBe(pins[0])
	})

	it("keeps each owner's pins apart", () => {
		expect(pinsStorageKey('enform:pins', 'did:plc:abc')).toBe('enform:pins:did:plc:abc')
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
