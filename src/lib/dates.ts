import {getLocale} from '#lib/paraglide/runtime.js'

export function formatDate(iso: string): string {
	return new Intl.DateTimeFormat(getLocale(), {dateStyle: 'medium', timeStyle: 'short'}).format(
		new Date(iso)
	)
}
