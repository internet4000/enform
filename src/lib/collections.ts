/**
 * A repo's collections, grouped by app: the domain their NSIDs come from (the first
 * two segments, reversed: app.bsky.feed.post → bsky.app).
 */
import {NSID} from '@atproto/syntax'

export type CollectionGroup = {app: string; collections: string[]}

export function appOf(nsid: string): string {
	if (!NSID.isValid(nsid)) return nsid
	return nsid.split('.').slice(0, 2).reverse().join('.')
}

export function groupByApp(collections: string[]): CollectionGroup[] {
	const groups = new Map<string, string[]>()
	for (const collection of [...collections].sort()) {
		const app = appOf(collection)
		groups.set(app, [...(groups.get(app) ?? []), collection])
	}
	return [...groups].map(([app, list]) => ({app, collections: list}))
}
