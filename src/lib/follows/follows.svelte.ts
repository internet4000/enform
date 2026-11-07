/**
 * The signed-in account's follows: com.internet4000.enform.follow records in its own
 * repo, each a subject DID and, optionally, one of its collections.
 */
import {AtUri} from '@atproto/syntax'
import app from '#lib/config/app.json' with {type: 'json'}
import type {Identity} from '#lib/atproto/identity'
import {listRecords} from '#lib/atproto/repo'
import {deleteRecord} from '#lib/atproto/write'
import {resolveLexicon} from '#lib/lexicons/resolve'
import {createFromForm} from '#lib/records/save'

export const FOLLOW = `${app.namespace}.follow`

export type Follow = {rkey: string; cid: string; subject: string; collection?: string}

function toFollow(record: {uri: string; cid: string; value: Record<string, unknown>}): Follow {
	return {
		rkey: new AtUri(record.uri).rkey,
		cid: record.cid,
		subject: String(record.value.subject),
		collection: typeof record.value.collection === 'string' ? record.value.collection : undefined
	}
}

class Follows {
	list = $state<Follow[]>([])
	loaded = $state(false)

	async load(me: Identity | undefined) {
		this.list = []
		this.loaded = false
		if (!me) return
		const all: Follow[] = []
		let cursor: string | undefined
		do {
			const page = await listRecords(me, FOLLOW, cursor).catch(() => undefined)
			all.push(...(page?.records ?? []).map(toFollow))
			cursor = page?.records.length ? page.cursor : undefined
		} while (cursor)
		this.list = all
		this.loaded = true
	}

	find(subject: string, collection?: string): Follow | undefined {
		return this.list.find((f) => f.subject === subject && f.collection === collection)
	}

	async follow(subject: string, collection?: string) {
		const value = {
			$type: FOLLOW,
			subject,
			...(collection ? {collection} : {}),
			createdAt: new Date().toISOString()
		}
		const {uri, cid} = await createFromForm(await resolveLexicon(FOLLOW), value)
		this.list = [...this.list, {rkey: new AtUri(uri).rkey, cid, subject, collection}]
	}

	async unfollow(follow: Follow) {
		await deleteRecord(FOLLOW, follow.rkey, follow.cid)
		this.list = this.list.filter((f) => f.rkey !== follow.rkey)
	}
}

export const follows = new Follows()
