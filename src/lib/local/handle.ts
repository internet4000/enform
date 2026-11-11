/**
 * A local profile's handle: its name, slugified, under `.local` ("My radio" →
 * my-radio.local). `.local` is a name no atproto handle can have (the handle spec
 * disallows it), so it is never taken for an account's: it says "on this device".
 */
export const LOCAL_TLD = '.local'

/** A name as a handle's first label: lowercase letters, digits and dashes */
export function slugify(name: string): string {
	const slug = name
		.normalize('NFKD')
		.replace(/[̀-ͯ]/g, '')
		.toLowerCase()
		.replace(/[^a-z0-9]+/g, '-')
		.replace(/^-+|-+$/g, '')
		.slice(0, 63)
		.replace(/-+$/, '')
	return slug || 'profile'
}

/** A slug none of `taken` has: the name's, else with a number after it */
export function uniqueSlug(name: string, taken: string[]): string {
	const base = slugify(name)
	let slug = base
	for (let n = 2; taken.includes(slug); n++) slug = `${base}-${n}`
	return slug
}

export const isLocalHandle = (actor: string) => actor.endsWith(LOCAL_TLD)

/** An at:// URI naming a repo on this device (`name.local`, or an older `local:<id>`) */
const ON_DEVICE = /at:\/\/(local:[^/\s"]+|[^/\s"]+\.local)(\/|$|")/

/**
 * Whether a record's value points at a record on this device. What is made on the
 * device stays private: an account's records, public, never name it.
 */
export const pointsOnDevice = (value: unknown) => ON_DEVICE.test(JSON.stringify(value) ?? '')
