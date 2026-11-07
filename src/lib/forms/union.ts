/** Naming refs: the $type a union member carries, and how to show it */
import {parseRef} from '#lib/lexicons/refs'

/**
 * A ref as a full $type: `nsid#def`, or the bare NSID for a lexicon's main def, as the
 * atproto data model writes it.
 */
export function refType(ref: string, base: string): string {
	const {nsid, def} = parseRef(ref, base)
	return def === 'main' ? nsid : `${nsid}#${def}`
}

/** A short name for a ref: its def, or the NSID's last segment for a main def */
export function refLabel(ref: string, base: string): string {
	const {nsid, def} = parseRef(ref, base)
	return def === 'main' ? (nsid.split('.').pop() ?? nsid) : def
}

export const STRONG_REF = 'com.atproto.repo.strongRef'

/** Whether a ref points to com.atproto.repo.strongRef (a record's URI and CID) */
export function isStrongRef(ref: string, base: string): boolean {
	return refType(ref, base) === STRONG_REF
}
