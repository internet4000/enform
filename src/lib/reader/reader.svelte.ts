/**
 * The reader: any list of records read one after another. Prev and next for every
 * record; each presenter says when its record is done (a track ended, a slideshow
 * shown), and autoplay goes on to the next. Always at hand, in one of three modes, like
 * Radio4000's decks: a small bar, docked beside the page (below it on phones), or full
 * screen. (docs/architecture.md › The reader)
 *
 * Several lists can be at hand at once, each in its deck (a radio's tracks, someone's
 * posts): each keeps its place and stays mounted, so what one plays goes on while
 * another is in front; each goes on to its next record when one is done.
 */
import type {Identity} from '#lib/atproto/identity'
import type {RepoRecord} from '#lib/atproto/repo'
import type {LexiconDoc} from '#lib/lexicons/types'

/** Small: a bar, its media out of sight but playing; docked: beside the page; full: the screen */
export type ReaderMode = 'small' | 'docked' | 'full'

export type ReaderItem = {repo: Identity; record: RepoRecord; lexicon?: LexiconDoc; href: string}

/** Which list a deck reads: the same list started again comes back to its deck */
export type ReaderList = {key: string; name: string}

/** Decks kept at once; starting one more lets the oldest go */
const MAX_DECKS = 4

class Deck {
	items = $state.raw<ReaderItem[]>([])
	index = $state(0)
	/** More items, when the list has more pages */
	more?: () => Promise<ReaderItem[]>

	readonly list: ReaderList

	constructor(
		list: ReaderList,
		items: ReaderItem[],
		index: number,
		more?: () => Promise<ReaderItem[]>
	) {
		this.list = list
		this.set(items, index, more)
	}

	set(items: ReaderItem[], index: number, more?: () => Promise<ReaderItem[]>) {
		this.items = items
		this.index = Math.max(0, Math.min(index, items.length - 1))
		this.more = more
	}
}

class Reader {
	decks = $state.raw<Deck[]>([])
	/** The deck in front */
	at = $state(0)
	mode = $state<ReaderMode>('docked')
	autoplay = $state(true)

	get deck(): Deck | undefined {
		return this.decks[this.at]
	}

	get items(): ReaderItem[] {
		return this.deck?.items ?? []
	}

	get index(): number {
		return this.deck?.index ?? 0
	}

	get current(): ReaderItem | undefined {
		return this.items[this.index]
	}

	get active() {
		return this.items.length > 0
	}

	/** Reads a list from `index`, in its own deck (the one it had, if started before) */
	start(
		items: ReaderItem[],
		index = 0,
		more?: () => Promise<ReaderItem[]>,
		list: ReaderList = {key: items[0]?.href ?? '', name: ''}
	) {
		if (!items.length) return
		const found = this.decks.findIndex((deck) => deck.list.key === list.key)
		if (found >= 0) {
			this.decks[found].set(items, index, more)
			this.at = found
		} else {
			const decks = [...this.decks, new Deck(list, items, index, more)]
			this.decks = decks.slice(-MAX_DECKS)
			this.at = this.decks.length - 1
		}
		this.mode = 'docked'
	}

	/** Brings a deck to the front: it goes on where it was */
	show(at: number) {
		if (at >= 0 && at < this.decks.length) this.at = at
	}

	/** Puts a deck away; the reader closes with the last one */
	closeDeck(at: number) {
		const decks = this.decks.filter((_, index) => index !== at)
		if (at < this.at || this.at >= decks.length) this.at = Math.max(0, this.at - 1)
		this.decks = decks
	}

	/** Reads the list's record at `index` */
	go(index: number) {
		const deck = this.deck
		if (deck && index >= 0 && index < deck.items.length) deck.index = index
	}

	/** Takes the list's record at `index` out; the next one takes its place */
	remove(index: number) {
		const deck = this.deck
		if (!deck || index < 0 || index >= deck.items.length) return
		const items = deck.items.filter((_, at) => at !== index)
		if (!items.length) return this.closeDeck(this.at)
		if (index < deck.index) deck.index--
		deck.index = Math.min(deck.index, items.length - 1)
		deck.items = items
	}

	get hasPrev() {
		return this.index > 0
	}

	get hasNext() {
		return this.index < this.items.length - 1 || !!this.deck?.more
	}

	prev() {
		if (this.deck && this.hasPrev) this.deck.index--
	}

	async next(deck = this.deck) {
		if (!deck) return
		if (deck.index < deck.items.length - 1) {
			deck.index++
			return
		}
		const more = deck.more ? await deck.more() : []
		if (more.length) {
			deck.items = [...deck.items, ...more]
			deck.index++
		} else {
			deck.more = undefined
		}
	}

	/** A deck's current record is done (its media ended, its slideshow shown): that
	    deck goes on, in front or not */
	ended(deck = this.deck) {
		if (!deck || !this.autoplay) return
		if (deck.index < deck.items.length - 1 || deck.more) void this.next(deck)
	}

	/** Stops reading: every deck put away */
	close() {
		this.decks = []
		this.at = 0
		this.mode = 'docked'
	}
}

export const reader = new Reader()
