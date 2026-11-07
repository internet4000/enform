/** Apps and types named from NSIDs: the app is the domain of the first two segments */
import {NSID} from '@atproto/syntax'

export function namespaceOf(nsid: string): string {
	return nsid.split('.').slice(0, 2).join('.')
}

export function appOf(nsid: string): string {
	if (!NSID.isValid(nsid)) return nsid
	return namespaceOf(nsid).split('.').reverse().join('.')
}

export function typeName(nsid: string): string {
	return nsid.slice(namespaceOf(nsid).length + 1).replaceAll('.', ' ')
}

/** Which one-record type is the app's profile: the one named profile, at its shallowest */
export function isProfileName(nsid: string): boolean {
	return nsid.split('.').at(-1) === 'profile'
}
