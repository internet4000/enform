/** The parts of Lexicon v1 documents that enform reads (https://atproto.com/specs/lexicon) */

export type LexNode = {
	type: string
	description?: string
	// boolean, integer, string
	default?: unknown
	const?: unknown
	// string
	format?: string
	knownValues?: string[]
	enum?: (string | number)[]
	minLength?: number
	maxLength?: number
	minGraphemes?: number
	maxGraphemes?: number
	// integer
	minimum?: number
	maximum?: number
	// object
	properties?: Record<string, LexNode>
	required?: string[]
	nullable?: string[]
	// array
	items?: LexNode
	// ref / union
	ref?: string
	refs?: string[]
	closed?: boolean
	// blob
	accept?: string[]
	maxSize?: number
	// record
	key?: string
	record?: LexNode
}

export type LexiconDoc = {
	lexicon: 1
	id: string
	revision?: number
	description?: string
	defs: Record<string, LexNode>
}
