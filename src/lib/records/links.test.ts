import {beforeEach, expect, test, vi} from 'vitest'

const identity = {did: 'did:plc:alice', handle: 'alice.test', pds: 'https://pds.test'}
const {getRecord, resolveIdentity, resolveLexicon} = vi.hoisted(() => ({
	getRecord: vi.fn(),
	resolveIdentity: vi.fn(),
	resolveLexicon: vi.fn()
}))

vi.mock('#lib/atproto/identity', () => ({resolveIdentity}))
vi.mock('#lib/atproto/repo', () => ({
	getRecord,
	blobUrl: (repo: {did: string}, cid: string) => `blob:${repo.did}/${cid}`
}))
vi.mock('#lib/lexicons/resolve', () => ({resolveLexicon}))

import {firstImage, isRecordUri, resolveLinkedRecord, resolvePerson} from './links'

const image = (cid: string) => ({$type: 'blob', ref: {$link: cid}, mimeType: 'image/jpeg', size: 1})

beforeEach(() => {
	vi.clearAllMocks()
	resolveIdentity.mockResolvedValue(identity)
	resolveLexicon.mockRejectedValue(new Error('none'))
})

test('a person: name and avatar from their profile', async () => {
	getRecord.mockResolvedValue({value: {displayName: ' Alice ', avatar: image('av')}})
	expect(await resolvePerson('did:plc:alice')).toEqual({
		identity,
		name: 'Alice',
		avatar: 'blob:did:plc:alice/av'
	})
	expect(getRecord).toHaveBeenCalledWith(identity, 'app.bsky.actor.profile', 'self')
})

test('a person without a profile is still their identity', async () => {
	getRecord.mockRejectedValue(new Error('RecordNotFound'))
	expect(await resolvePerson('did:plc:noprofile')).toEqual({
		identity,
		name: undefined,
		avatar: undefined
	})
})

test('people are looked up once', async () => {
	getRecord.mockResolvedValue({value: {}})
	await Promise.all([resolvePerson('did:plc:once'), resolvePerson('did:plc:once')])
	expect(resolveIdentity).toHaveBeenCalledTimes(1)
})

test('a linked record, from its own repo', async () => {
	getRecord.mockResolvedValue({
		value: {
			text: 'Hello',
			createdAt: '2026-01-01T00:00:00Z',
			embed: {images: [{image: image('pic'), alt: ''}]}
		}
	})
	const uri = 'at://did:plc:alice/app.bsky.feed.post/1'
	expect(await resolveLinkedRecord(uri)).toEqual({
		uri,
		collection: 'app.bsky.feed.post',
		author: identity,
		title: 'Hello',
		text: undefined,
		image: 'blob:did:plc:alice/pic',
		date: '2026-01-01T00:00:00Z'
	})
	expect(getRecord).toHaveBeenCalledWith(identity, 'app.bsky.feed.post', '1')
	expect(resolveIdentity).toHaveBeenCalledWith('did:plc:alice')
	await resolveLinkedRecord(uri)
	expect(getRecord).toHaveBeenCalledTimes(1)
})

test('identifiers are not titles', async () => {
	getRecord.mockResolvedValue({value: {subject: {uri: 'at://did:plc:x/a.b.c/1', cid: 'c'}}})
	const linked = await resolveLinkedRecord('at://did:plc:alice/app.bsky.feed.like/2')
	expect(linked.title).toBeUndefined()
})

test('a failed record is tried again next time', async () => {
	const uri = 'at://did:plc:alice/app.bsky.feed.post/gone'
	getRecord.mockRejectedValueOnce(new Error('RecordNotFound'))
	await expect(resolveLinkedRecord(uri)).rejects.toThrow()
	getRecord.mockResolvedValue({value: {text: 'Back'}})
	expect((await resolveLinkedRecord(uri)).title).toBe('Back')
})

test('only record URIs make cards', () => {
	expect(isRecordUri('at://did:plc:x/a.b.c/1')).toBe(true)
	expect(isRecordUri('at://did:plc:x/a.b.c')).toBe(false)
	expect(isRecordUri('at://did:plc:x')).toBe(false)
	expect(isRecordUri('nope')).toBe(false)
})

test('images are found a few levels down, not deeper', () => {
	expect(firstImage({a: {b: image('x')}})).toBe('x')
	expect(firstImage({a: {b: {c: {d: {e: {f: image('x')}}}}}})).toBeUndefined()
})
