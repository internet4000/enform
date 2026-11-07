/** The Lexicon string formats, checked with @atproto/syntax */
import {
	isAtIdentifierString,
	isValidAtUri,
	isValidDatetime,
	isValidDid,
	isValidHandle,
	isValidLanguage,
	isValidNsid,
	isValidRecordKey,
	isValidTid,
	isValidUri
} from '@atproto/syntax'

/** CIDv1 in base32 (as atproto writes them), or a CIDv0 */
const CID = /^(b[a-z2-7]{50,}|Qm[1-9A-HJ-NP-Za-km-z]{44})$/

const checks: Record<string, (value: string) => boolean> = {
	'at-identifier': (value) => isAtIdentifierString(value),
	'at-uri': (value) => isValidAtUri(value),
	cid: (value) => CID.test(value),
	datetime: (value) => isValidDatetime(value),
	did: (value) => isValidDid(value),
	handle: (value) => isValidHandle(value),
	language: (value) => isValidLanguage(value),
	nsid: (value) => isValidNsid(value),
	'record-key': (value) => isValidRecordKey(value),
	tid: (value) => isValidTid(value),
	uri: (value) => isValidUri(value)
}

/** Whether a string is valid in a format; unknown formats pass */
export function isValidFormat(format: string, value: string): boolean {
	return checks[format]?.(value) ?? true
}
