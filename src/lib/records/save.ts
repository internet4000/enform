/**
 * Saving a record from a form: validated against its lexicons first (the PDS may not
 * know them), then written to the signed-in account's repo.
 */
import {createRecord, putRecord} from '#lib/atproto/write'
import {lexiconClosure, validateRecord} from '#lib/forms/validate'
import {profileKey} from '#lib/lexicons/kind'
import type {LexiconDoc} from '#lib/lexicons/types'

async function validate(lexicon: LexiconDoc, value: Record<string, unknown>) {
	const result = validateRecord(await lexiconClosure(lexicon.id), lexicon.id, value)
	if (!result.success) throw new Error(result.error)
}

export async function createFromForm(lexicon: LexiconDoc, value: Record<string, unknown>) {
	await validate(lexicon, value)
	// A profile's record has its one key (literal:self → self); others get a TID from the PDS
	return createRecord(lexicon.id, value, profileKey(lexicon))
}

export async function updateFromForm(
	lexicon: LexiconDoc,
	rkey: string,
	value: Record<string, unknown>,
	cid: string
) {
	await validate(lexicon, value)
	return putRecord(lexicon.id, rkey, value, cid)
}
