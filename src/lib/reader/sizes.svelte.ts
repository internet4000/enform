/**
 * The reader's sizes, as one drags them: its share given to the record and its media
 * (the rest to what's up next), and, docked, its width beside the page (wide screens) or
 * its height above the tab bar (phones). Kept on this device; the stylesheet's sizes until
 * one drags.
 */
import app from '#lib/config/app.json' with {type: 'json'}

export type ReaderSizes = {
	/** The record and its media, as a share of the reader's height (0–1) */
	split?: number
	/** Docked beside the page, in px */
	width?: number
	/** Docked above the tab bar, in px */
	height?: number
}

export const clamp = (value: number, min: number, max: number) =>
	Math.min(max, Math.max(min, value))

function load(): ReaderSizes {
	try {
		const value: unknown = JSON.parse(localStorage.getItem(app.storage.readerSizes) ?? '{}')
		return value && typeof value === 'object' ? (value as ReaderSizes) : {}
	} catch {
		return {}
	}
}

class Sizes {
	value = $state<ReaderSizes>(typeof localStorage === 'undefined' ? {} : load())

	set(change: ReaderSizes) {
		this.value = {...this.value, ...change}
		try {
			localStorage.setItem(app.storage.readerSizes, JSON.stringify(this.value))
		} catch {
			// Not kept (private browsing): the size holds for this visit
		}
	}
}

export const sizes = new Sizes()
