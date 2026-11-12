// More is Settings again, opened from who you are: old links still land
import {redirect} from '@sveltejs/kit'
import {addressOf, inApp} from '#lib/paths'

export function load({url}) {
	redirect(308, inApp(`/settings${addressOf(url).search}`))
}
