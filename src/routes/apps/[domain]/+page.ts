import {NSID} from '@atproto/syntax'
import {appInfo} from '#lib/apps/directory'
import {namespaceOf} from '#lib/apps/names'
import {knownApp} from '#lib/apps/apps'

export function load({params, url}) {
	// An app's namespace is its domain reversed (4000.radio → radio.4000); a discovered
	// app comes with one of its types, to find where its lexicons are published
	const seed = url.searchParams.get('type') ?? undefined
	const namespace =
		seed && NSID.isValid(seed)
			? namespaceOf(seed)
			: params.domain.split('.').reverse().slice(0, 2).join('.')
	// Not awaited: the app shows while its catalog of types loads
	return {info: appInfo(namespace), app: knownApp(namespace, seed)}
}
