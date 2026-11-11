/**
 * Publishing a local profile to the current account: its records, validated against
 * their lexicons, created in one batch with their keys. A record whose key the account
 * already holds (a one-per-account profile) is skipped, never overwritten.
 */
import type {Identity} from '#lib/atproto/identity'
import {getRecord} from '#lib/atproto/repo'
import {createBatch} from '#lib/atproto/write'
import {lexiconClosure, validateRecord} from '#lib/forms/validate'
import {allRecords} from './store'

/** What was published; already there; not valid; kept here (example apps' records) */
import {isExample} from '#lib/lexicons/examples/index'
export type Published = {created: number; skipped: string[]; invalid: string[]; kept: string[]}

export async function publishProfile(profile: string, account: Identity): Promise<Published> {
	const records = await allRecords(profile)
	const skipped: string[] = []
	const invalid: string[] = []
	const kept: string[] = []
	const ready = []
	for (const record of records) {
		const name = `${record.collection}/${record.rkey}`
		// An example app's: no one can resolve its type, so it stays on this device
		if (isExample(record.collection)) {
			kept.push(name)
			continue
		}
		const docs = await lexiconClosure(record.collection).catch(() => [])
		if (!docs.length || !validateRecord(docs, record.collection, record.value).success) {
			invalid.push(name)
			continue
		}
		const exists = await getRecord(account, record.collection, record.rkey).then(
			() => true,
			() => false
		)
		if (exists) skipped.push(name)
		else ready.push({collection: record.collection, rkey: record.rkey, value: record.value})
	}
	if (ready.length) await createBatch(ready)
	return {created: ready.length, skipped, invalid, kept}
}
