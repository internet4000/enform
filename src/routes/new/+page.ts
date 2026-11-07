import {knownApps} from '#lib/apps/apps'

export function load() {
	// Apps enform knows, with their record types, as suggestions of what to create
	return {known: knownApps()}
}
