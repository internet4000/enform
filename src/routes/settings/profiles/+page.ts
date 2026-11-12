// Profiles became Switch account: old links still land
import {redirect} from '@sveltejs/kit'
import {inApp} from '#lib/paths'

export function load() {
	redirect(308, inApp('/settings/accounts'))
}
