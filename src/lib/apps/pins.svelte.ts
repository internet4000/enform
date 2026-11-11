/**
 * The pins, on this device, of whoever you act as (an account, a local profile, or no
 * one): apps, and profiles in apps, in the rail and first on Home
 * (docs/architecture.md › Pins)
 */
import app from '#lib/config/app.json' with {type: 'json'}
import {localIdentity} from '#lib/atproto/identity'
import {auth} from '#lib/auth/session.svelte'
import {movePin, parsePins, pinKey, pinsStorageKey, readPin, togglePin, type Pin} from './pins'

class Pins {
	/** Each owner's list, once read from storage */
	#lists = new Map<string, string[]>()
	/** Bumped on every change, so what reads the lists updates */
	#version = $state(0)

	/** Whose pins: the DID you act as, or no one's when signed out */
	get owner(): string | undefined {
		return auth.local ? localIdentity(auth.local).did : auth.did
	}

	/** Every pin, as stored, in order; none until who you are is known */
	get keys(): string[] {
		void this.#version
		if (!auth.ready) return []
		const owner = this.owner
		let keys = this.#lists.get(owner ?? '')
		if (!keys) {
			keys = load(owner)
			this.#lists.set(owner ?? '', keys)
		}
		return keys
	}

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

	/** The signed-out pins went to someone: read them again when signed out */
	forgetSignedOut() {
		this.#lists.delete('')
	}

	#save(keys: string[]) {
		const owner = this.owner
		this.#lists.set(owner ?? '', keys)
		this.#version++
		try {
			localStorage.setItem(pinsStorageKey(app.storage.pins, owner), JSON.stringify(keys))
		} catch {
			// Private windows or blocked storage: pinned for this visit only
		}
	}
}

/**
 * This owner's pins. An account or profile with none yet on this device takes the
 * pins made before anyone was acting (signed out, or before pins had owners): they
 * were most likely theirs, made while trying things out.
 */
function load(owner: string | undefined): string[] {
	try {
		const key = pinsStorageKey(app.storage.pins, owner)
		const stored = localStorage.getItem(key)
		if (stored !== null) return parsePins(stored)
		const from = [app.storage.pins, ...(owner ? [pinsStorageKey(app.storage.pins, undefined)] : [])]
		const before = from.flatMap((old) => parsePins(localStorage.getItem(old)))
		if (!before.length) return []
		const keys = [...new Set(before)]
		localStorage.setItem(key, JSON.stringify(keys))
		for (const old of from) localStorage.removeItem(old)
		if (owner) pins.forgetSignedOut()
		return keys
	} catch {
		return []
	}
}

export const pins = new Pins()
