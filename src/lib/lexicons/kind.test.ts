import {expect, test} from 'vitest'
import {collectionKind, profileKey} from './kind'
import type {LexiconDoc} from './types'

const doc = (key?: string): LexiconDoc => ({
	lexicon: 1,
	id: 'a.b.c',
	defs: {main: {type: 'record', key, record: {type: 'object'}}}
})

test('the record key type says what a collection is', () => {
	expect(collectionKind(doc('literal:self'))).toBe('profile')
	expect(collectionKind(doc('tid'))).toBe('list')
	expect(collectionKind(doc('any'))).toBe('set')
	expect(collectionKind(undefined)).toBe('set')
	expect(profileKey(doc('literal:self'))).toBe('self')
})
