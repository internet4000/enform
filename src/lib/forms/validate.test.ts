import {expect, test} from 'vitest'
import {lexiconClosure, validateRecord} from './validate'
import {resolveDoc} from './fixtures'

test('the closure follows refs across lexicons, once each', async () => {
	const docs = await lexiconClosure('test.feed.post', resolveDoc)
	expect(docs.map((doc) => doc.id).sort()).toEqual([
		'com.atproto.repo.strongRef',
		'test.embed.images',
		'test.feed.post'
	])
})

test('records are validated with @atproto/lexicon, blobs included', async () => {
	const docs = await lexiconClosure('test.feed.post', resolveDoc)
	const cid = 'bafkreibme22gw2h7y2h7tg2fhqotaqjucnbc24deqo72b6mkl2egezxhvy'
	const valid = {
		$type: 'test.feed.post',
		text: 'hi',
		createdAt: '2026-01-01T00:00:00.000Z',
		embed: {
			$type: 'test.embed.images',
			images: [{alt: '', image: {$type: 'blob', ref: {$link: cid}, mimeType: 'image/png', size: 3}}]
		}
	}
	expect(validateRecord(docs, 'test.feed.post', valid)).toEqual({success: true})
	const invalid = validateRecord(docs, 'test.feed.post', {...valid, createdAt: undefined})
	expect(invalid.success).toBe(false)
})
