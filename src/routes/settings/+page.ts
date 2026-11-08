// Settings live in More now: old links (and sign-ins started there) still land
import {redirect} from '@sveltejs/kit'
import {resolve} from '$app/paths'

export function load({url}) {
	redirect(308, `${resolve('more')}${url.search}`)
}
