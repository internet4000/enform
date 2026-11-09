/**
 * Choosing a handle (https://atproto.com/specs/handle): a name under one of your
 * server's domains, or a domain of your own, which points at your account by a DNS TXT
 * record or an HTTPS file, as handle resolution reads them.
 */
import {isValidHandle, normalizeHandle} from '@atproto/syntax'
import {resolveHandle} from './identity'
import {xrpcGet} from './xrpc'

/** The domains a server gives handles under (".bsky.social"), from its description */
export async function serverDomains(pds: string): Promise<string[]> {
	const {availableUserDomains = []} = await xrpcGet<{availableUserDomains?: string[]}>(
		pds,
		'com.atproto.server.describeServer'
	)
	return availableUserDomains.map((domain) => (domain.startsWith('.') ? domain : `.${domain}`))
}

/** A name typed under a server's domain, or a whole domain, as a handle (if it is one) */
export function handleOf(name: string, domain?: string): string | undefined {
	const typed = name.trim().replace(/^@/, '').toLowerCase()
	const handle = domain ? `${typed}${domain}` : typed
	return typed && isValidHandle(handle) ? normalizeHandle(handle) : undefined
}

/** What a domain has to publish to be this account's handle */
export function proofs(handle: string, did: string) {
	return {
		dns: {name: `_atproto.${handle}`, value: `did=${did}`},
		https: {url: `https://${handle}/.well-known/atproto-did`, value: did}
	}
}

/** Where a handle points: at this account, at another, or at none yet */
export async function pointsAt(handle: string, did: string): Promise<'you' | 'other' | 'none'> {
	const found = await resolveHandle(handle).catch(() => undefined)
	return !found ? 'none' : found === did ? 'you' : 'other'
}
