/** The message for a count's plural category in the current locale (one, other…) */
import {getLocale} from '#lib/paraglide/runtime.js'

export function plural(count: number, forms: {one: () => string; other: () => string}): string {
	const category = new Intl.PluralRules(getLocale()).select(count)
	return category === 'one' ? forms.one() : forms.other()
}
