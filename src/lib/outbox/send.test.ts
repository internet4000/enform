import 'fake-indexeddb/auto'
import {beforeEach, expect, test} from 'vitest'
import {XrpcError} from '#lib/atproto/xrpc'
import {sendPending, type Send} from './send'
import {outbox} from './outbox.svelte'
import {allPending, enqueue, markConflict, removePending, type PendingWrite} from './store'

const did = 'did:plc:send'

beforeEach(async () => {
	for (const write of await allPending()) await removePending(write.id!)
})

const queue = (op: PendingWrite['op'], rkey: string, swap?: string) =>
	enqueue({did, op, collection: 'a.b.c', rkey, value: op === 'delete' ? undefined : {}, swap})

/** A PDS holding records by rkey at a version; a stale swap is refused, as InvalidSwap */
function pds(versions: Record<string, string>) {
	const calls: [string, string, string | undefined][] = []
	let made = 0
	const send: Send = async (write, swap) => {
		calls.push([write.op, write.rkey, swap])
		if (write.op !== 'create' && swap !== undefined && versions[write.rkey] !== swap)
			throw new XrpcError(400, 'InvalidSwap', 'Record was at ' + versions[write.rkey])
		if (write.op === 'delete') {
			delete versions[write.rkey]
			return undefined
		}
		return (versions[write.rkey] = `v${++made}`)
	}
	return {send, calls}
}

test('a write after another of its record swaps against the version that one made', async () => {
	await queue('update', 'r', 'v0')
	await queue('update', 'r', '')
	await queue('delete', 'r', '')
	const {send, calls} = pds({r: 'v0'})
	expect(await sendPending(did, send)).toBe(3)
	expect(calls).toEqual([
		['update', 'r', 'v0'],
		['update', 'r', 'v1'],
		['delete', 'r', 'v2']
	])
	expect(await allPending()).toEqual([])
})

test('a conflict holds the later writes of its record, never sent without a swap', async () => {
	await queue('update', 'r', 'v0')
	await queue('update', 'r', '')
	await queue('update', 'other', 'w0')
	const {send, calls} = pds({r: 'changed elsewhere', other: 'w0'})
	expect(await sendPending(did, send)).toBe(1)
	expect(calls.map(([, rkey, swap]) => [rkey, swap])).toEqual([
		['r', 'v0'],
		['other', 'w0']
	])
	const [conflict, held] = await allPending()
	expect(conflict.conflict).toMatch(/Record was at/)
	expect(held.conflict).toBeUndefined()
	// Sent again: still held behind the conflict
	expect(await sendPending(did, send)).toBe(0)
})

test('the version made is kept with the next write, if sending stops in between', async () => {
	await queue('update', 'r', 'v0')
	await queue('update', 'r', '')
	let calls = 0
	const offline: Send = async () => {
		if (calls++) throw new TypeError('Failed to fetch')
		return 'v1'
	}
	expect(await sendPending(did, offline)).toBe(1)
	expect((await allPending()).map((write) => write.swap)).toEqual(['v1'])
})

test('a write given up hands the next one the version it would have written over', async () => {
	await queue('update', 'r', 'v0')
	await queue('update', 'r', '')
	const [first] = await allPending()
	await markConflict(first, 'changed elsewhere')
	await outbox.discard(first)
	const {send, calls} = pds({r: 'changed elsewhere'})
	expect(await sendPending(did, send)).toBe(0)
	expect(calls).toEqual([['update', 'r', 'v0']])
	expect((await allPending())[0].conflict).toMatch(/Record was at/)
})
