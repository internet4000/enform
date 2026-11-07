import {expect, test} from 'vitest'
import {fromLocalInput, toLocalInput} from './datetime'

test('local inputs round-trip through UTC', () => {
	const local = '2026-03-29T01:30'
	const iso = fromLocalInput(local)
	expect(iso).toBe(new Date(2026, 2, 29, 1, 30).toISOString())
	expect(toLocalInput(iso)).toBe(local)
})

test('an instant shows in local time, whatever offset it was written with', () => {
	const date = new Date('2026-01-01T12:00:00+05:00')
	expect(toLocalInput('2026-01-01T12:00:00+05:00')).toBe(toLocalInput(date.toISOString()))
})

test('empty and invalid are empty', () => {
	expect(toLocalInput(undefined)).toBe('')
	expect(toLocalInput('nope')).toBe('')
	expect(fromLocalInput('')).toBe('')
})
