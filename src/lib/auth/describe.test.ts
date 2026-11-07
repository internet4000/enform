import {expect, test} from 'vitest'
import {grants} from './describe'

test('granted scopes as permissions', () => {
	expect(
		grants('atproto repo:radio.4000.track?action=create repo:*?action=delete blob:image/*')
	).toEqual([
		{kind: 'repo', collections: ['radio.4000.track'], actions: ['create']},
		{kind: 'repo', collections: ['*'], actions: ['delete']},
		{kind: 'blob', accept: ['image/*']}
	])
})
