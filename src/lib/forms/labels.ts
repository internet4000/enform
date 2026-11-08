/**
 * A field's label for people: common field names said in words (and translated), any
 * other name split into words (createdAt → Created at, aspectRatio → Aspect ratio)
 */
import * as m from '#lib/paraglide/messages.js'

const KNOWN: Record<string, () => string> = {
	text: m.field_text,
	title: m.field_title,
	name: m.field_name,
	displayName: m.field_display_name,
	description: m.field_description,
	url: m.field_url,
	uri: m.field_url,
	alt: m.field_alt,
	avatar: m.field_avatar,
	banner: m.field_banner,
	image: m.field_image,
	images: m.field_images,
	tags: m.field_tags,
	langs: m.field_langs,
	createdAt: m.field_created_at,
	updatedAt: m.field_updated_at,
	status: m.field_status,
	subject: m.field_subject
}

export function humanize(name: string): string {
	const words = name
		.replace(/([a-z0-9])([A-Z])/g, '$1 $2')
		.replace(/[_-]+/g, ' ')
		.trim()
		.toLowerCase()
	return words.charAt(0).toUpperCase() + words.slice(1)
}

export function fieldLabel(name: string): string {
	return KNOWN[name]?.() ?? humanize(name)
}
