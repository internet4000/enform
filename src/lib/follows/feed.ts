/**
 * The Following feed, read in the browser: each followed collection's latest records,
 * straight from each repo's own PDS, newest first.
 */
import {resolveIdentity, type Identity} from '#lib/atproto/identity'
import {listRecords, type RepoRecord} from '#lib/atproto/repo'
import {recordDate} from '#lib/records/summary'
import type {Follow} from './follows.svelte'

export type FeedItem = {repo: Identity; collection: string; record: RepoRecord; date?: string}

export async function followingFeed(list: Follow[], size: number): Promise<FeedItem[]> {
	const pages = await Promise.all(
		list
			.filter((follow) => follow.collection)
			.map(async (follow) => {
				const collection = follow.collection as string
				const repo = await resolveIdentity(follow.subject).catch(() => undefined)
				if (!repo) return []
				const page = await listRecords(repo, collection).catch(() => undefined)
				return (page?.records ?? []).map((record) => ({
					repo,
					collection,
					record,
					date: recordDate(record.value)
				}))
			})
	)
	return pages
		.flat()
		.sort((a, b) => (b.date ?? '').localeCompare(a.date ?? ''))
		.slice(0, size)
}
