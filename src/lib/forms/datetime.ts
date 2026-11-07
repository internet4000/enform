/**
 * Between atproto datetimes (ISO 8601 with a timezone) and `datetime-local` inputs,
 * which show and take the browser's local time with no timezone.
 */

const pad = (n: number) => String(n).padStart(2, '0')

/** An ISO datetime as a datetime-local value, to the minute; '' when there's none */
export function toLocalInput(iso: unknown): string {
	if (typeof iso !== 'string' || !iso) return ''
	const date = new Date(iso)
	if (Number.isNaN(date.getTime())) return ''
	const day = `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`
	return `${day}T${pad(date.getHours())}:${pad(date.getMinutes())}`
}

/** A datetime-local value (local time) as an ISO datetime in UTC; '' when empty */
export function fromLocalInput(local: string): string {
	if (!local) return ''
	const date = new Date(local)
	return Number.isNaN(date.getTime()) ? '' : date.toISOString()
}

/** The browser's timezone, to say what time the input is in */
export function localTimeZone(): string {
	return Intl.DateTimeFormat().resolvedOptions().timeZone
}
