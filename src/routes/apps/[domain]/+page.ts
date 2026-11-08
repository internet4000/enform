import {NSID} from '@atproto/syntax'
import {appInfo} from '#lib/apps/directory'
import {namespaceOf, namespaceOfDomain} from '#lib/apps/names'
import {knownApp} from '#lib/apps/apps'

export function load({params, url}) {
	// An app's namespace is its domain reversed; a discovered
	// app comes with one of its types, to find where its lexicons are published
	const seed = url.searchParams.get('type') ?? undefined
	const namespace =
		seed && NSID.isValid(seed) ? namespaceOf(seed) : namespaceOfDomain(params.domain)
	// Not awaited: the app shows while its catalog of types loads
	return {info: appInfo(namespace), app: knownApp(namespace, seed)}
}
