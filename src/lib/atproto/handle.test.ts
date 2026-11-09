import {expect, test} from 'vitest'
import {handleOf, proofs} from './handle'

test('a name under a server domain, or a whole domain', () => {
	expect(handleOf('Alice', '.bsky.social')).toBe('alice.bsky.social')
	expect(handleOf('@example.com')).toBe('example.com')
	expect(handleOf('not a handle')).toBeUndefined()
	expect(handleOf('')).toBeUndefined()
	expect(handleOf('example')).toBeUndefined()
})

test('what a domain publishes to point at an account', () => {
	const {dns, https} = proofs('example.com', 'did:plc:abc')
	expect(dns).toEqual({name: '_atproto.example.com', value: 'did=did:plc:abc'})
	expect(https).toEqual({url: 'https://example.com/.well-known/atproto-did', value: 'did:plc:abc'})
})
