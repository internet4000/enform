/**
 * Pinned apps: the apps someone keeps at hand, by domain, in their order. Kept on this
 * device (localStorage): pinning needs no permission. Pure helpers, tested; the state
 * that uses them is in pins.svelte.ts.
 */
import {isValidHandle} from '@atproto/syntax'

/** An app's domain, as pinned: a valid domain name, lowercased */
const isDomain = (value: unknown): value is string =>
	typeof value === 'string' && isValidHandle(value)

/** The stored list, without duplicates or anything that isn't a domain */
export function parsePins(raw: string | null | undefined): string[] {
	try {
		const value: unknown = JSON.parse(raw ?? '[]')
		return Array.isArray(value)
			? [...new Set(value.filter(isDomain).map((domain) => domain.toLowerCase()))]
			: []
	} catch {
		return []
	}
}

/** Pins it at the end, or unpins it */
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
