/**
 * `$app/paths` in the embed: enform's paths become links to an enform instance, by
 * default the one it was built with (its ORIGIN and BASE_PATH, as the app's), else the
 * one the element names
 */
declare const __ENFORM__: string

let base = __ENFORM__

/** The enform instance the embed links to */
export function linkTo(instance: string) {
	base = instance.endsWith('/') ? instance : `${instance}/`
}

export function resolve(path: string): string {
	return new URL(path.replace(/^\//, ''), base).href
}
