/**
 * <enform-embed actor="alice.example" app="4000.radio">: a profile's home in an app, on
 * any page (docs/embed.md). One module, no dependency on any enform instance: it reads
 * the repo's own PDS; its links go to enform (or the instance named by `enform="…"`).
 * Its styles are enform's, in its own shadow root, so the page's and its own don't mix.
 */
import {mount, unmount} from 'svelte'
import styles from '../styles/index.css?inline'
import embedStyles from './embed.css?inline'
import Embed from './Embed.svelte'
import {linkTo} from './paths'
import {reader} from '#lib/reader/reader.svelte'

/** enform's styles for a whole page, for this element: its :root and html are the host */
const css = `${styles}\n${embedStyles}`
	.replace(/:root\b/g, ':host')
	.replace(/(^|[\s,}])html(?=[\s,{])/g, '$1:host')

class EnformEmbed extends HTMLElement {
	static observedAttributes = ['actor', 'app', 'enform']
	#app?: ReturnType<typeof mount>

	connectedCallback() {
		this.#render()
	}

	disconnectedCallback() {
		if (this.#app) void unmount(this.#app)
		this.#app = undefined
	}

	attributeChangedCallback() {
		if (this.#app) this.#render()
	}

	#render() {
		const actor = this.getAttribute('actor')
		const app = this.getAttribute('app')
		if (!actor || !app) return
		const enform = this.getAttribute('enform')
		if (enform) linkTo(enform)
		const root = this.shadowRoot ?? this.attachShadow({mode: 'open'})
		if (this.#app) void unmount(this.#app)
		root.replaceChildren()
		const style = document.createElement('style')
		style.textContent = css
		root.append(style)
		// On a page that is someone's, the reader starts as a small bar
		reader.mode = 'small'
		this.#app = mount(Embed, {target: root, props: {actor, app}})
	}
}

if (!customElements.get('enform-embed')) customElements.define('enform-embed', EnformEmbed)
