import permissions from '#lib/config/permissions.json' with {type: 'json'}
import {groupByApp} from '#lib/collections'

export function load() {
	// Collections enform knows, by app, as suggestions of what to create
	return {known: groupByApp(permissions.collections)}
}
