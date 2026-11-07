import {expect, test} from 'vitest'
import type {RepoRecord} from '#lib/atproto/repo'
import {overlayList, overlayRecord} from './overlay'
import type {PendingWrite} from './store'

const record = (rkey: string, n: number): RepoRecord => ({
	uri: `at://did:plc:a/a.b.c/${rkey}`,
	cid: `c${rkey}`,
	collection: 'a.b.c',
	rkey,
	value: {n}
})
const write = (op: PendingWrite['op'], rkey: string, n?: number): PendingWrite => ({
	did: 'did:plc:a',
	op,
	collection: 'a.b.c',
	rkey,
	value: n === undefined ? undefined : {n},
	createdAt: ''
})

test('waiting writes laid over a page: created first, updated replaced, deleted gone', () => {
	const shown = overlayList(
		[record('2', 2), record('1', 1)],
		[write('create', '3', 3), write('update', '2', 20), write('delete', '1')],
		true
	)
	expect(shown.map((r) => [r.rkey, r.value.n, r.pending])).toEqual([
		['3', 3, 'waiting'],
		['2', 20, 'waiting']
	])
})

test('later pages get no created records', () => {
	expect(overlayList([], [write('create', '3', 3)], false)).toEqual([])
})

test('one record: its waiting value, or gone', () => {
	expect(overlayRecord(record('1', 1), [write('update', '1', 10)], 'a.b.c', '1')?.value).toEqual({
		n: 10
	})
	expect(overlayRecord(record('1', 1), [write('delete', '1')], 'a.b.c', '1')).toBeUndefined()
	expect(overlayRecord(undefined, [write('create', '9', 9)], 'a.b.c', '9')?.pending).toBe('waiting')
})
