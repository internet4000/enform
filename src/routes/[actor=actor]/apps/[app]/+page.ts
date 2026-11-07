import {NSID} from '@atproto/syntax'
import {knownApp} from '#lib/apps/apps'
import {namespaceOf} from '#lib/apps/names'

export async function load({parent, params, url}) {
	const {apps} = await parent()
	const found = (await apps).find((app) => app.app === params.app)
	if (found) return {app: found}
	// An app this repo has nothing in yet (to start on it): as its lexicons describe it
	const type = url.searchParams.get('type')
	const namespace =
		type && NSID.isValid(type)
			? namespaceOf(type)
			: params.app.split('.').reverse().slice(0, 2).join('.')
	return {app: await knownApp(namespace, type ?? undefined)}
}
