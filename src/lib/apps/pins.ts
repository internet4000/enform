/**
 * Pins: the apps someone keeps at hand, and the profiles in them (a radio on Radio4000),
 * in their order. An app is pinned by its domain ("4000.radio"); a profile in an app by
 * its account's DID and the app's domain ("did:plc:…/4000.radio"), so it stays pinned
 * when its handle changes. Each account and local profile has its own list, and so has
 * no one (signed out). Kept on this device (localStorage): pinning needs no permission.
 * Pure helpers, tested; the state that uses them is in pins.svelte.ts.
 */
import {isValidDid, isValidHandle} from '@atproto/syntax'

export type Pin = {domain: string; did?: string}

/** A pin as stored */
export const pinKey = ({domain, did}: Pin): string => (did ? `${did}/${domain}` : domain)

/** Where an owner's pins are stored: by their DID, or for no one when signed out */
export const pinsStorageKey = (prefix: string, owner: string | undefined): string =>
	`${prefix}:${owner ?? 'signed-out'}`

/** A stored pin, if it is one: a domain, or a DID and a domain */
export function readPin(value: unknown): Pin | undefined {
	if (typeof value !== 'string') return undefined
	const at = value.lastIndexOf('/')
	const domain = value.slice(at + 1).toLowerCase()
	const did = at < 0 ? undefined : value.slice(0, at)
	if (!isValidHandle(domain) || (did !== undefined && !isValidDid(did))) return undefined
	return {domain, did}
}

/** The stored list, without duplicates or anything that isn't a pin */
export function parsePins(raw: string | null | undefined): string[] {
	try {
		const value: unknown = JSON.parse(raw ?? '[]')
		if (!Array.isArray(value)) return []
		const pins = value.map(readPin).filter((pin) => pin !== undefined)
		return [...new Set(pins.map(pinKey))]
	} catch {
		return []
	}
}

/** Pins it at the end, or unpins it (an app's domain, or a profile's pin key) */
export function togglePin(pins: string[], domain: string): string[] {
	return pins.includes(domain) ? pins.filter((pin) => pin !== domain) : [...pins, domain]
}

/** Moves a pin by `by` places (-1: up, 1: down), within the list */
export function movePin(pins: string[], domain: string, by: number): string[] {
	const from = pins.indexOf(domain)
	const to = from + by
	if (from === -1 || to < 0 || to >= pins.length) return pins
	const moved = [...pins]
	moved.splice(from, 1)
	moved.splice(to, 0, domain)
	return moved
}
