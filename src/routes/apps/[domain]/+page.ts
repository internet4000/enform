import {error} from '@sveltejs/kit'
import {appInfo, directoryApps} from '#lib/apps/directory'
import {knownApp} from '#lib/apps/apps'

export function load({params}) {
	const info = directoryApps().find((app) => app.domain === params.domain)
	if (!info) error(404, params.domain)
	// Not awaited: the app shows while its catalog of types loads
	return {info: appInfo(info.namespace), app: knownApp(info.namespace)}
}
