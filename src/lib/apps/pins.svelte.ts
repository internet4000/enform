/**
 * The pins, on this device, of whoever you act as (an account or a local profile):
 * apps, and profiles in apps, in the rail and first on Home. With no one acting,
 * pinning starts on this device, as its default profile: pins are always someone's,
 * and never move from one to another (docs/architecture.md › Pins)
 */
import app from '#lib/config/app.json' with {type: 'json'}
import {localIdentity} from '#lib/atproto/identity'
import {auth} from '#lib/auth/session.svelte'
import {startOnDevice} from '#lib/local/start'
import * as m from '#lib/paraglide/messages.js'
import {movePin, parsePins, pinKey, pinsStorageKey, readPin, togglePin, type Pin} from './pins'

class Pins {
	/** Each owner's list, once read from storage */
	#lists = new Map<string, string[]>()
	/** Bumped on every change, so what reads the lists updates */
	#version = $state(0)

	/** Whose pins: the DID you act as, if anyone */
	get owner(): string | undefined {
		return auth.local ? localIdentity(auth.local).did : auth.did
	}

	/** Every pin, as stored, in order; none until who you are is known */
	get keys(): string[] {
		void this.#version
		const owner = this.owner
		if (!auth.ready || !owner) return []
		let keys = this.#lists.get(owner)
		if (!keys) {
			keys = load(owner)
			this.#lists.set(owner, keys)
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

	/** Pins or unpins it; with no one acting, as this device's default profile */
	async toggle(domain: string, did?: string) {
		if (!this.owner) await startOnDevice(m.local_default_name())
		this.#save(togglePin(this.keys, pinKey({domain, did})))
	}

	move(pin: Pin, by: number) {
		this.#save(movePin(this.keys, pinKey(pin), by))
	}

	#save(keys: string[]) {
		const owner = this.owner
		if (!owner) return
		this.#lists.set(owner, keys)
		this.#version++
		try {
			localStorage.setItem(pinsStorageKey(app.storage.pins, owner), JSON.stringify(keys))
		} catch {
			// Private windows or blocked storage: pinned for this visit only
		}
	}
}

/** This owner's pins, on this device */
function load(owner: string): string[] {
	try {
		return parsePins(localStorage.getItem(pinsStorageKey(app.storage.pins, owner)))
	} catch {
		return []
	}
}

export const pins = new Pins()
