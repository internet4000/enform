/** A repo's collections, grouped by their NSID authority (who defines them) */
import {NSID} from '@atproto/syntax'

export type CollectionGroup = {authority: string; collections: string[]}

export function groupByAuthority(collections: string[]): CollectionGroup[] {
	const groups = new Map<string, string[]>()
	for (const collection of [...collections].sort()) {
		const authority = NSID.isValid(collection) ? NSID.parse(collection).authority : collection
		groups.set(authority, [...(groups.get(authority) ?? []), collection])
	}
	return [...groups].map(([authority, list]) => ({authority, collections: list}))
}
