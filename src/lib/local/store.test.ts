import 'fake-indexeddb/auto'
import {expect, test} from 'vitest'
import * as store from './store'

test('a profile and its records, newest first, paged', async () => {
	const profile = await store.createProfile('Me')
	expect((await store.listProfiles()).map((p) => p.name)).toContain('Me')
	const a = await store.createRecord(profile.id, 'a.b.c', {$type: 'a.b.c', n: 1})
	const b = await store.createRecord(profile.id, 'a.b.c', {$type: 'a.b.c', n: 2})
	await store.createRecord(profile.id, 'x.y.z', {$type: 'x.y.z'}, 'self')
	expect(await store.listCollections(profile.id)).toEqual(['a.b.c', 'x.y.z'])
	const first = await store.listRecords(profile.id, 'a.b.c', 1)
	expect(first.records[0].rkey).toBe(b.rkey)
	const next = await store.listRecords(profile.id, 'a.b.c', 1, first.cursor)
	expect(next.records[0].rkey).toBe(a.rkey)
})

test('writes swap against the version read', async () => {
	const profile = await store.createProfile('Swap')
	const record = await store.createRecord(profile.id, 'a.b.c', {n: 1})
	const updated = await store.putRecord(profile.id, 'a.b.c', record.rkey, {n: 2}, record.version)
	await expect(
		store.putRecord(profile.id, 'a.b.c', record.rkey, {n: 3}, record.version)
	).rejects.toThrow(store.LocalConflict)
	await expect(store.createRecord(profile.id, 'a.b.c', {n: 4}, record.rkey)).rejects.toThrow()
	await store.deleteRecord(profile.id, 'a.b.c', record.rkey, updated.version)
	expect(await store.getRecord(profile.id, 'a.b.c', record.rkey)).toBeUndefined()
})

test('removing a profile removes its records', async () => {
	const profile = await store.createProfile('Gone')
	await store.createRecord(profile.id, 'a.b.c', {n: 1})
	await store.removeProfile(profile.id)
	expect(await store.allRecords(profile.id)).toEqual([])
	expect(await store.getProfile(profile.id)).toBeUndefined()
})
