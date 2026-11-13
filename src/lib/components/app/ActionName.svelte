<script lang="ts">
	// What an action is called, as people read it: Play, Read…; a person by their handle
	// (@alice.test →), a record by its type (Event →), so one knows where a click goes
	import * as m from '#lib/paraglide/messages.js'
	import {resolveIdentity} from '#lib/atproto/identity'
	import {typeLabel} from '#lib/apps/directory'
	import type {RecordAction} from '#lib/records/actions'

	let {action}: {action: RecordAction} = $props()

	const words: Record<'play' | 'view' | 'map' | 'read', () => string> = {
		play: m.action_play,
		view: m.action_view,
		map: m.action_map,
		read: m.action_read
	}
</script>

{#if action.verb === 'account'}
	{#await resolveIdentity(action.did)}
		{m.action_account({name: action.did})}
	{:then identity}
		{m.action_account({name: identity.handle ? `@${identity.handle}` : action.did})}
	{:catch}
		{m.action_account({name: action.did})}
	{/await}
{:else if action.verb === 'record'}
	{m.action_record({type: typeLabel(action.collection)})}
{:else}
	{words[action.verb]()}
{/if}
