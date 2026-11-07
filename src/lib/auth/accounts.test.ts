import {expect, test} from 'vitest'
import {
	loadAccounts,
	nextAccount,
	parseAccounts,
	saveAccounts,
	withAccount,
	withoutAccount
} from './accounts'

const a = 'did:plc:aaaaaaaaaaaaaaaaaaaaaaaa'
const b = 'did:web:example.com'
const c = 'did:plc:cccccccccccccccccccccccc'

test('parses a stored list, dropping duplicates and non-DIDs', () => {
	expect(parseAccounts(JSON.stringify([a, b, a, 'alice.bsky.social', 3, null]))).toEqual([a, b])
})

test('anything unreadable is an empty list', () => {
	expect(parseAccounts(null)).toEqual([])
	expect(parseAccounts('not json')).toEqual([])
	expect(parseAccounts('{"did":"x"}')).toEqual([])
})

test('adds an account once, at the end', () => {
	expect(withAccount([a], b)).toEqual([a, b])
	expect(withAccount([a, b], a)).toEqual([a, b])
})

test('removes an account', () => {
	expect(withoutAccount([a, b, c], b)).toEqual([a, c])
	expect(withoutAccount([a], b)).toEqual([a])
})

test('the next account is the following one, else the previous, else none', () => {
	expect(nextAccount([a, b, c], b)).toBe(c)
	expect(nextAccount([a, b, c], c)).toBe(b)
	expect(nextAccount([a], a)).toBeUndefined()
	expect(nextAccount([a, b], c)).toBe(b)
})

test('saves and loads through storage', () => {
	const store = new Map<string, string>()
	const storage = {
		getItem: (key: string) => store.get(key) ?? null,
		setItem: (key: string, value: string) => void store.set(key, value)
	}
	saveAccounts([a, b], storage)
	expect(loadAccounts(storage)).toEqual([a, b])
})

test('storage that throws is ignored', () => {
	const broken = {
		getItem: (): string | null => {
			throw new Error('blocked')
		},
		setItem: () => {
			throw new Error('blocked')
		}
	}
	expect(loadAccounts(broken)).toEqual([])
	expect(() => saveAccounts([a], broken)).not.toThrow()
})
