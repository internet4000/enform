import {expect, test} from 'vitest'
import {isLocalHandle, slugify, uniqueSlug} from './handle'

test('a name as a handle label', () => {
	expect(slugify('My Radio')).toBe('my-radio')
	expect(slugify('  Élodie’s  notes! ')).toBe('elodie-s-notes')
	expect(slugify('***')).toBe('profile')
})

test('never the same as another profile on the device', () => {
	expect(uniqueSlug('My radio', [])).toBe('my-radio')
	expect(uniqueSlug('My radio', ['my-radio', 'my-radio-2'])).toBe('my-radio-3')
})

test('local handles are told apart', () => {
	expect(isLocalHandle('my-radio.local')).toBe(true)
	expect(isLocalHandle('alice.test')).toBe(false)
})
