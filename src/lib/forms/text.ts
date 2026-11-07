/** Measuring strings the way Lexicon limits them: UTF-8 bytes and graphemes */

const encoder = new TextEncoder()
const segmenter = new Intl.Segmenter()

/** A string's length in UTF-8 bytes (what maxLength and minLength count) */
export function byteLength(value: string): number {
	return encoder.encode(value).length
}

/** A string's length in graphemes, as people count characters */
export function graphemeLength(value: string): number {
	let count = 0
	for (const _ of segmenter.segment(value)) count++
	return count
}
