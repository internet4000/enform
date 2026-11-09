/**
 * The pins, on this device: apps, and profiles in apps, in the rail and first on Home
 * (docs/architecture.md › Pins)
 */
import app from '#lib/config/app.json' with {type: 'json'}
import {movePin, parsePins, pinKey, readPin, togglePin, type Pin} from './pins'

class Pins {
	/** Every pin, as stored, in order */
	keys = $state.raw<string[]>(load())

	/** Every pin, in order */
	get all(): Pin[] {
		return this.keys.map(readPin).filter((pin) => pin !== undefined)
	}

	/** The pinned apps' domains, in order */
	get domains(): string[] {
		return this.all.filter((pin) => !pin.did).map((pin) => pin.domain)
	}

	/** The pinned profiles in apps, in order */
	get profiles(): Required<Pin>[] {
		return this.all.filter((pin): pin is Required<Pin> => !!pin.did)
	}

	has(domain: string, did?: string) {
		return this.keys.includes(pinKey({domain, did}))
	}

	toggle(domain: string, did?: string) {
		this.#save(togglePin(this.keys, pinKey({domain, did})))
	}

	move(pin: Pin, by: number) {
		this.#save(movePin(this.keys, pinKey(pin), by))
	}

	#save(keys: string[]) {
		this.keys = keys
		try {
			localStorage.setItem(app.storage.pins, JSON.stringify(keys))
		} catch {
			// Private windows or blocked storage: pinned for this visit only
		}
	}
}

function load(): string[] {
	try {
		return parsePins(globalThis.localStorage?.getItem(app.storage.pins))
	} catch {
		return []
	}
}

export const pins = new Pins()
