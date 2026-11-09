/**
 * The URL one sees: the page's, or the one the search field set as one types (a shallow
 * navigation, which loads nothing again). Everything a page narrows by its URL reads it here.
 */
import {page} from '$app/state'

export const shownUrl = (): URL => (page.shallow?.url as URL | undefined) ?? (page.url as URL)
