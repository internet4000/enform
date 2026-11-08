// More is Settings again, opened from who you are: old links still land
import {redirect} from '@sveltejs/kit'
import {resolve} from '$app/paths'

export function load({url}) {
	redirect(308, `${resolve('settings')}${url.search}`)
}
