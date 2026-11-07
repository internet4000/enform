/**
 * The accounts signed in on this browser, as a list of DIDs in localStorage. Only a
 * convenience to list and switch between them: each session itself is kept, restored
 * and revoked by @atproto/oauth-client-browser.
 */
import {isValidDid} from '@atproto/syntax'
import app from '#lib/config/app.json' with {type: 'json'}

const KEY = app.storage.accounts

const isDid = (value: unknown): value is string => typeof value === 'string' && isValidDid(value)

/** The stored list, without duplicates or anything that isn't a DID */
export function parseAccounts(raw: string | null | undefined): string[] {
	try {
		const value: unknown = JSON.parse(raw ?? '[]')
		return Array.isArray(value) ? [...new Set(value.filter(isDid))] : []
	} catch {
		return []
	}
}

export function withAccount(dids: string[], did: string): string[] {
	return dids.includes(did) ? dids : [...dids, did]
}

export function withoutAccount(dids: string[], did: string): string[] {
	return dids.filter((other) => other !== did)
}

/** The account to use once this one is gone: the next in the list, else the previous */
export function nextAccount(dids: string[], did: string): string | undefined {
	const index = dids.indexOf(did)
	const others = withoutAccount(dids, did)
	return (index === -1 ? undefined : others[index]) ?? others.at(-1)
}

export function loadAccounts(storage: Pick<Storage, 'getItem'> = localStorage): string[] {
	try {
		return parseAccounts(storage.getItem(KEY))
	} catch {
		return []
	}
}

export function saveAccounts(dids: string[], storage: Pick<Storage, 'setItem'> = localStorage) {
	try {
		storage.setItem(KEY, JSON.stringify(dids))
	} catch {
		// Private windows or blocked storage: the list is only a convenience
	}
}
