import {expect, test} from 'vitest'
import {
	DECLARED_SCOPES,
	actionsFor,
	allowsBlob,
	allowsRepo,
	scopeForBlob,
	scopeForRepo,
	withScopes
} from './scopes'

test('sign-in alone allows no writes', () => {
	expect(allowsRepo('atproto', 'app.bsky.feed.post', 'create')).toBe(false)
})

test('declared collections are authorized one collection and action at a time', () => {
	const scope = scopeForRepo('radio.4000.track', 'create')
	expect(scope).toBe('repo:radio.4000.track?action=create')
	const granted = `atproto ${scope}`
	expect(allowsRepo(granted, 'radio.4000.track', 'create')).toBe(true)
	expect(allowsRepo(granted, 'radio.4000.track', 'delete')).toBe(false)
	expect(allowsRepo(granted, 'radio.4000.profile', 'create')).toBe(false)
})

test('other collections need the action on all collections', () => {
	const scope = scopeForRepo('com.example.recipe', 'create')
	expect(scope).toBe('repo:*?action=create')
	expect(allowsRepo(`atproto ${scope}`, 'com.example.recipe', 'create')).toBe(true)
})

test('every scope asked for is declared', () => {
	for (const scope of [
		scopeForRepo('a.b.c', 'update'),
		scopeForRepo('app.bsky.feed.post', 'delete'),
		scopeForBlob('image/png'),
		scopeForBlob('application/pdf')
	]) {
		expect(DECLARED_SCOPES).toContain(scope)
	}
})

test('step-up keeps what was granted and drops what was not declared', () => {
	const granted = 'atproto repo:a.b.c?action=create repo:*?action=create'
	const next = withScopes(granted, [scopeForRepo('a.b.c', 'delete')])
	expect(next).toBe('atproto repo:*?action=create repo:*?action=delete')
})

test('blob scopes, narrowest first', () => {
	expect(scopeForBlob('image/png')).toBe('blob:image/*')
	expect(scopeForBlob('application/pdf')).toBe('blob:*/*')
	expect(allowsBlob('atproto blob:image/*', 'image/png')).toBe(true)
	expect(allowsBlob('atproto', 'image/png')).toBe(false)
})

test('an edit needs create and update, as putRecord is checked by the PDS', () => {
	expect(actionsFor('update')).toEqual(['create', 'update'])
	expect(actionsFor('create')).toEqual(['create'])
	expect(actionsFor('delete')).toEqual(['delete'])
})
