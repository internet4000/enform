/** DID documents (did:plc and did:web), cached for the session */
import app from '#lib/config/app.json' with {type: 'json'}

export type DidDocument = {
	id: string
	alsoKnownAs?: string[]
	service?: {id: string; type: string; serviceEndpoint: string}[]
}

const documents = new Map<string, Promise<DidDocument>>()

function documentUrl(did: string): string {
	if (did.startsWith('did:plc:')) return `${app.services.plcDirectory}/${did}`
	if (did.startsWith('did:web:')) {
		return `https://${decodeURIComponent(did.slice('did:web:'.length))}/.well-known/did.json`
	}
	throw new Error(`Unsupported DID method: ${did}`)
}

export function didDocument(did: string): Promise<DidDocument> {
	let doc = documents.get(did)
	if (!doc) {
		// Checked with its server each time it's read again: a handle may have just changed
		doc = fetch(documentUrl(did), {
			cache: 'no-cache',
			signal: AbortSignal.timeout(app.reads.timeoutMs)
		}).then(async (res) => {
			if (!res.ok) throw new Error(`Could not resolve ${did} (${res.status})`)
			const json = (await res.json()) as DidDocument
			if (json.id !== did) throw new Error(`DID document for ${did} names ${json.id}`)
			return json
		})
		doc.catch(() => documents.delete(did))
		documents.set(did, doc)
	}
	return doc
}

/** Reads this DID's document again next time (its handle changed) */
export function forgetDocument(did: string) {
	documents.delete(did)
}

/** The handle a DID document claims (still to be verified the other way) */
export function claimedHandle(doc: DidDocument): string | undefined {
	return doc.alsoKnownAs?.find((aka) => aka.startsWith('at://'))?.slice('at://'.length)
}

/** The repo's host: the #atproto_pds service */
export function pdsEndpoint(doc: DidDocument): string {
	const pds = doc.service?.find(
		(s) => s.id.endsWith('#atproto_pds') && s.type === 'AtprotoPersonalDataServer'
	)
	if (!pds) throw new Error(`${doc.id} has no PDS`)
	return pds.serviceEndpoint
}
