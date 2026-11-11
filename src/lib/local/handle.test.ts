import {expect, test} from 'vitest'
import {isLocalHandle, pointsOnDevice, slugify, uniqueSlug} from './handle'

test('a name as a handle label', () => {
	expect(slugify('My Radio')).toBe('my-radio')
	expect(slugify('  Élodie’s  notes! ')).toBe('elodie-s-notes')
	expect(slugify('***')).toBe('profile')
})

test('never the same as another profile on the device', () => {
	expect(uniqueSlug('My radio', [])).toBe('my-radio')
	expect(uniqueSlug('My radio', ['my-radio', 'my-radio-2'])).toBe('my-radio-3')
})

test('local handles are told apart', () => {
	expect(isLocalHandle('my-radio.local')).toBe(true)
	expect(isLocalHandle('alice.test')).toBe(false)
})

test("what points at this device's records is told apart, at any depth", () => {
	const subject = (uri: string) => ({subject: {uri, cid: 'bafy'}, list: [{uri}]})
	expect(pointsOnDevice(subject('at://my-radio.local/radio.4000.track/3m6fkq2xmsk2a'))).toBe(true)
	expect(pointsOnDevice({list: ['at://local:abc123/radio.4000.track/x']})).toBe(true)
	expect(pointsOnDevice({text: 'at://my-radio.local'})).toBe(true)
	expect(pointsOnDevice(subject('at://alice.test/radio.4000.track/3m6fkq2xmsk2a'))).toBe(false)
	expect(pointsOnDevice({text: 'a .local network, at://did:plc:abc/app.bsky.feed.post/x'})).toBe(
		false
	)
})
