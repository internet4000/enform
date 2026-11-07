import {expect, test} from 'vitest'
import {stringControl, suggestedLanguages} from './controls'

test('long or unlimited free text gets a textarea, names and formats a line', () => {
	expect(stringControl({type: 'string', maxGraphemes: 300})).toBe('textarea')
	expect(stringControl({type: 'string'})).toBe('textarea')
	expect(stringControl({type: 'string', maxGraphemes: 64})).toBe('input')
	expect(stringControl({type: 'string', maxGraphemes: 300}, 'title')).toBe('input')
	expect(stringControl({type: 'string', maxGraphemes: 256}, 'description')).toBe('textarea')
	expect(stringControl({type: 'string', maxGraphemes: 20}, 'description')).toBe('input')
	expect(stringControl({type: 'string', format: 'uri'})).toBe('input')
	expect(stringControl({type: 'string', format: 'datetime'})).toBe('datetime')
	expect(stringControl({type: 'string', enum: ['a']})).toBe('select')
	expect(stringControl({type: 'string', knownValues: ['a']})).toBe('input')
})

test('suggested languages start with the reader’s, once each', () => {
	const languages = suggestedLanguages(['fr-CA', 'fr'])
	expect(languages.slice(0, 3)).toEqual(['fr-CA', 'fr', 'en'])
	expect(languages.filter((l) => l === 'fr')).toHaveLength(1)
})
