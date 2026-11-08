/**
 * The reader: any list of records read one after another. Prev and next for every
 * record; each presenter says when its record is done (a track ended, a slideshow
 * shown), and autoplay goes on to the next. Always at hand, in one of three modes, like
 * Radio4000's decks: a small bar, docked beside the page (below it on phones), or full
 * screen. (docs/architecture.md › The reader)
 */
import type {Identity} from '#lib/atproto/identity'
import type {RepoRecord} from '#lib/atproto/repo'
import type {LexiconDoc} from '#lib/lexicons/types'

/** Small: a bar, its media out of sight but playing; docked: beside the page; full: the screen */
export type ReaderMode = 'small' | 'docked' | 'full'

export type ReaderItem = {repo: Identity; record: RepoRecord; lexicon?: LexiconDoc; href: string}

class Reader {
	items = $state.raw<ReaderItem[]>([])
	index = $state(0)
	mode = $state<ReaderMode>('docked')
	autoplay = $state(true)
	/** More items, when the list has more pages */
	#more?: () => Promise<ReaderItem[]>

	get current(): ReaderItem | undefined {
		return this.items[this.index]
	}

	get active() {
		return this.items.length > 0
	}

	start(items: ReaderItem[], index = 0, more?: () => Promise<ReaderItem[]>) {
		this.items = items
		this.index = Math.max(0, Math.min(index, items.length - 1))
		this.#more = more
		this.mode = 'docked'
	}

	/** Reads the list's record at `index` */
	go(index: number) {
		if (index >= 0 && index < this.items.length) this.index = index
	}

	get hasPrev() {
		return this.index > 0
	}

	get hasNext() {
		return this.index < this.items.length - 1 || !!this.#more
	}

	prev() {
		if (this.hasPrev) this.index--
	}

	async next() {
		if (this.index < this.items.length - 1) {
			this.index++
			return
		}
		const more = this.#more ? await this.#more() : []
		if (more.length) {
			this.items = [...this.items, ...more]
			this.index++
		} else {
			this.#more = undefined
		}
	}

	/** The current record is done (its media ended, its slideshow shown) */
	ended() {
		if (this.autoplay && this.hasNext) void this.next()
	}

	close() {
		this.items = []
		this.index = 0
		this.mode = 'docked'
		this.#more = undefined
	}
}

export const reader = new Reader()
