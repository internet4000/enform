/**
 * Form patterns found from a lexicon object's shape: which of its fields work together.
 * Keyed on lexicon definitions, never on an app (docs/principles.md › Forms).
 */
import type {LexNode} from '#lib/lexicons/types'
import {FACET} from './richtext'

/** An image file field, and the siblings it fills: alt text, and its size */
export type ImageFields = {image: string; alt?: string; ratio?: string}

const isImage = (node: LexNode | undefined) =>
	node?.type === 'blob' && (!node.accept || node.accept.some((type) => type.startsWith('image/')))

export function imageFields(node: LexNode): ImageFields | undefined {
	const properties = node.properties ?? {}
	const image = Object.keys(properties).find((key) => isImage(properties[key]))
	if (!image) return undefined
	const alt = properties.alt?.type === 'string' ? 'alt' : undefined
	const ratio = Object.keys(properties).find((key) => {
		const field = properties[key]
		const sized = field.type === 'object' && field.properties?.width && field.properties?.height
		return sized || (field.type === 'ref' && /aspectRatio$/i.test(field.ref ?? ''))
	})
	return {image, alt, ratio}
}

/** A text and its facets list, generated from the text */
export type RichTextFields = {text: string; facets: string}

export function richTextFields(node: LexNode): RichTextFields | undefined {
	const properties = node.properties ?? {}
	const facets = Object.keys(properties).find((key) => {
		const field = properties[key]
		return field.type === 'array' && field.items?.type === 'ref' && field.items.ref === FACET
	})
	const text = Object.keys(properties).find(
		(key) => properties[key].type === 'string' && key === 'text'
	)
	return facets && text ? {text, facets} : undefined
}
