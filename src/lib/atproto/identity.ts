/**
 * Handle ⇄ DID ⇄ PDS, as the atproto identity spec defines it: a handle resolves
 * through DNS (_atproto TXT) or HTTPS (/.well-known/atproto-did), and is trusted only
 * when the DID document claims it back.
 */
import {isValidDid, isValidHandle, normalizeHandle} from '@atproto/syntax'
import app from '#lib/config/app.json' with {type: 'json'}
import {txtDids} from './dns'
import {claimedHandle, didDocument, pdsEndpoint} from './did'
import {xrpcGet} from './xrpc'

export type Identity = {
	did: string
	/** Verified both ways, else undefined */
	handle?: string
	pds: string
}

async function wellKnownDid(handle: string): Promise<string | undefined> {
	const res = await fetch(`https://${handle}/.well-known/atproto-did`, {
		signal: AbortSignal.timeout(app.reads.timeoutMs)
	}).catch(() => undefined)
	const did = res?.ok ? (await res.text()).trim() : ''
	return isValidDid(did) ? did : undefined
}

/**
 * DNS first, then HTTPS. Browsers often can't read the well-known file (CORS), so a
 * com.atproto.identity.resolveHandle service answers last; its result is still
 * verified against the DID document, like any other.
 */
export async function resolveHandle(handle: string): Promise<string> {
	const name = normalizeHandle(handle)
	const [fromDns] = await txtDids(`_atproto.${name}`).catch(() => [])
	if (fromDns && isValidDid(fromDns)) return fromDns
	const fromHttps = await wellKnownDid(name)
	if (fromHttps) return fromHttps
	const {did} = await xrpcGet<{did: string}>(
		app.services.handleResolver,
		'com.atproto.identity.resolveHandle',
		{handle: name}
	)
	return did
}

const identities = new Map<string, Promise<Identity>>()

async function lookup(actor: string): Promise<Identity> {
	const did = isValidDid(actor) ? actor : await resolveHandle(actor)
	const doc = await didDocument(did)
	const claimed = claimedHandle(doc)
	const verified =
		claimed && isValidHandle(claimed) && (await resolveHandle(claimed).catch(() => null)) === did
	return {did, handle: verified ? normalizeHandle(claimed) : undefined, pds: pdsEndpoint(doc)}
}

/** A handle or DID to its verified identity, cached for the session */
export function resolveIdentity(actor: string): Promise<Identity> {
	const key = isValidDid(actor) ? actor : normalizeHandle(actor)
	let identity = identities.get(key)
	if (!identity) {
		identity = lookup(key)
		identity.catch(() => identities.delete(key))
		identities.set(key, identity)
	}
	return identity
}
