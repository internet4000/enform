/**
 * Apps by name: config/apps.json names the apps and types enform knows, for people.
 * Anything else is named from its NSID. Icons come from the protocol: an app's domain
 * is often a handle, whose profile has an avatar.
 */
import directory from '#lib/config/apps.json' with {type: 'json'}
import {getLocale} from '#lib/paraglide/runtime.js'
import {resolveIdentity} from '#lib/atproto/identity'
import {profileAvatar} from '#lib/atproto/profile'
import {appOf, namespaceOf, typeName} from './names'

type Localized = Record<string, string>

export type AppInfo = {
	namespace: string
	domain: string
	name: string
	description?: string
	url?: string
	/** The protocol's own collections, kept apart from apps */
	protocol: boolean
	known: boolean
}

type Entry = (typeof directory.apps)[number] & {protocol?: boolean}

const entries = new Map<string, Entry>(directory.apps.map((app) => [app.namespace, app]))

function localized(text: Localized | undefined): string | undefined {
	return text?.[getLocale()] ?? text?.en
}

export function appInfo(namespace: string): AppInfo {
	const entry = entries.get(namespace)
	const domain = appOf(`${namespace}.x`)
	return {
		namespace,
		domain,
		name: entry?.name ?? domain,
		description: localized(entry?.description),
		url: entry?.url,
		protocol: !!entry?.protocol,
		known: !!entry
	}
}

/** Every app the directory lists, protocol excluded */
export function directoryApps(): AppInfo[] {
	return directory.apps.filter((app) => !('protocol' in app)).map((app) => appInfo(app.namespace))
}

/** The types an app's directory entry names, in its order (the usual ones first) */
export function directoryTypes(namespace: string): string[] {
	return Object.keys(entries.get(namespace)?.types ?? {})
}

/** What people call a record type: its label in the directory, else its name in the NSID */
export function typeLabel(nsid: string): string {
	const types = entries.get(namespaceOf(nsid))?.types as Record<string, Localized> | undefined
	const label = localized(types?.[nsid])
	if (label) return label
	const name = typeName(nsid)
	return name.charAt(0).toUpperCase() + name.slice(1)
}

const icons = new Map<string, Promise<string | undefined>>()

/** An app's icon: the avatar of the account its domain names, when there is one */
export function appIcon(domain: string): Promise<string | undefined> {
	let icon = icons.get(domain)
	if (!icon) {
		icon = resolveIdentity(domain)
			.then(profileAvatar)
			.catch(() => undefined)
		icons.set(domain, icon)
	}
	return icon
}

/** Orders an app's types the directory's way (the usual ones first), others after */
export function byDirectory<T extends {nsid: string}>(types: T[]): T[] {
	const order = (nsid: string) => {
		const index = directoryTypes(namespaceOf(nsid)).indexOf(nsid)
		return index === -1 ? Number.MAX_SAFE_INTEGER : index
	}
	return [...types].sort((a, b) => order(a.nsid) - order(b.nsid))
}

/** Whether the directory declares records of `from` to hold the same thing as `to`'s */
export function declaredRelated(from: string, to: string): boolean {
	return directory.related.some((pair) => pair.from === from && pair.to === to)
}
