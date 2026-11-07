/** Field errors and formats in the reader's language */
import * as m from '#lib/paraglide/messages.js'
import {getLocale} from '#lib/paraglide/runtime.js'
import type {FieldError} from './types'

const formats: Record<string, () => string> = {
	uri: m.format_uri,
	'at-uri': m.format_at_uri,
	'at-identifier': m.format_at_identifier,
	cid: m.format_cid,
	datetime: m.format_datetime,
	did: m.format_did,
	handle: m.format_handle,
	language: m.format_language,
	nsid: m.format_nsid,
	'record-key': m.format_record_key,
	tid: m.format_tid
}

export function formatName(format: string): string {
	return formats[format]?.() ?? format
}

export function errorMessage(error: FieldError): string {
	switch (error.code) {
		case 'required':
			return m.form_error_required()
		case 'const':
			return m.form_error_const({value: error.value})
		case 'enum':
			return m.form_error_enum()
		case 'integer':
			return m.form_error_integer()
		case 'type':
			return m.form_error_type({expected: error.expected})
		case 'format':
			return m.form_error_format({format: formatName(error.format)})
		case 'union_member':
			return m.form_error_union_member()
		case 'unresolved':
			return m.form_error_unresolved({ref: error.ref})
		default: {
			const limit = new Intl.NumberFormat(getLocale()).format(error.limit)
			const messages = {
				min_length: m.form_error_min_length,
				max_length: m.form_error_max_length,
				min_graphemes: m.form_error_min_graphemes,
				max_graphemes: m.form_error_max_graphemes,
				min_items: m.form_error_min_items,
				max_items: m.form_error_max_items,
				minimum: m.form_error_minimum,
				maximum: m.form_error_maximum
			}
			return messages[error.code]({limit})
		}
	}
}

/** A file size, like "1.5 MB" */
export function formatBytes(bytes: number): string {
	const units = ['byte', 'kilobyte', 'megabyte', 'gigabyte'] as const
	const power = Math.min(Math.floor(Math.log10(Math.max(bytes, 1)) / 3), units.length - 1)
	return new Intl.NumberFormat(getLocale(), {
		style: 'unit',
		unit: units[power],
		unitDisplay: 'short',
		maximumFractionDigits: 1
	}).format(bytes / 1000 ** power)
}
