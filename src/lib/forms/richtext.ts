/**
 * Rich text facets (app.bsky.richtext.facet, a lexicon other apps reuse): links,
 * #tags and @mentions found in a text, with the UTF-8 byte ranges the spec requires.
 * https://atproto.com/specs/data-model — facets index text by UTF-8 bytes
 */
export const FACET = 'app.bsky.richtext.facet'

export type Facet = {
	$type: typeof FACET
	index: {byteStart: number; byteEnd: number}
	features: Record<string, string>[]
}

export type Found =
	| {kind: 'link'; text: string; start: number; end: number; uri: string}
	| {kind: 'tag'; text: string; start: number; end: number; tag: string}
	| {kind: 'mention'; text: string; start: number; end: number; handle: string}

const TRAILING = /[.,;:!?)\]}"'»”’]+$/u
const encoder = new TextEncoder()

/** The UTF-8 byte offset of a string index */
function bytes(text: string, index: number): number {
	return encoder.encode(text.slice(0, index)).length
}

function scan(
	text: string,
	pattern: RegExp,
	make: (match: string, start: number) => Found | undefined
) {
	const found: Found[] = []
	for (const match of text.matchAll(pattern)) {
		const lead = match[1] ?? ''
		const raw = match[2].replace(TRAILING, '')
		const item = make(raw, (match.index ?? 0) + lead.length)
		if (item) found.push(item)
	}
	return found
}

/** Links, #tags and @mentions in a text, in order */
export function detect(text: string): Found[] {
	const links = scan(text, /(^|[\s(])(https?:\/\/\S+)/gu, (uri, start) => ({
		kind: 'link',
		text: uri,
		start,
		end: start + uri.length,
		uri
	}))
	const tags = scan(text, /(^|\s)(#[^\s#]+)/gu, (raw, start) => {
		const tag = raw.slice(1)
		if (!tag || /^\d+$/.test(tag) || tag.length > 64) return undefined
		return {kind: 'tag', text: raw, start, end: start + raw.length, tag}
	})
	const mentions = scan(text, /(^|[\s(])(@[a-zA-Z0-9.-]+\.[a-zA-Z0-9-]+)/gu, (raw, start) => ({
		kind: 'mention',
		text: raw,
		start,
		end: start + raw.length,
		handle: raw.slice(1).toLowerCase()
	}))
	return [...links, ...tags, ...mentions].sort((a, b) => a.start - b.start)
}

/** Facets for what was found; mentions need their handle's DID (else are left out) */
export async function facets(
	text: string,
	resolve: (handle: string) => Promise<string | undefined>
): Promise<Facet[]> {
	const result: Facet[] = []
	for (const item of detect(text)) {
		const index = {byteStart: bytes(text, item.start), byteEnd: bytes(text, item.end)}
		let feature: Record<string, string> | undefined
		if (item.kind === 'link') feature = {$type: `${FACET}#link`, uri: item.uri}
		if (item.kind === 'tag') feature = {$type: `${FACET}#tag`, tag: item.tag}
		if (item.kind === 'mention') {
			const did = await resolve(item.handle).catch(() => undefined)
			if (did) feature = {$type: `${FACET}#mention`, did}
		}
		if (feature) result.push({$type: FACET, index, features: [feature]})
	}
	return result
}
