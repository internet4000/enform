/** The pinned apps, on this device: in the rail, first on Home (docs/architecture.md › Pins) */
import app from '#lib/config/app.json' with {type: 'json'}
import {movePin, parsePins, togglePin} from './pins'

class Pins {
	domains = $state.raw<string[]>(load())

	has(domain: string) {
		return this.domains.includes(domain)
	}

	toggle(domain: string) {
		this.#save(togglePin(this.domains, domain))
	}

	move(domain: string, by: number) {
		this.#save(movePin(this.domains, domain, by))
	}

	#save(domains: string[]) {
		this.domains = domains
		try {
			localStorage.setItem(app.storage.pins, JSON.stringify(domains))
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
