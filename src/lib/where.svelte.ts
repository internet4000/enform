/**
 * The address one sees: the page's, or the one the search field set as one types (a
 * shallow navigation, which loads nothing again). Everything a page narrows by its
 * address reads it here: a path and a query, after the page URL's `#` (paths.ts).
 */
import {page} from '$app/state'
import {addressOf} from './paths'

export const shownUrl = (): URL =>
	addressOf((page.shallow?.url as URL | undefined) ?? (page.url as URL))
