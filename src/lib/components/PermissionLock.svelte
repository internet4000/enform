<script lang="ts">
	// A lock on an action's button while enform still needs permission for it. The same
	// tap asks for it (a popup from your server), then does the action.
	import * as m from '#lib/paraglide/messages.js'
	import {auth} from '#lib/auth/session.svelte'
	import {isDeclared, type RepoAction} from '#lib/auth/scopes'
	import {typeLabel} from '#lib/apps/directory'

	let {collection, action}: {collection: string; action: RepoAction} = $props()

	let locked = $derived(!!auth.session && !auth.canWrite(collection, action))
	let actionName = $derived(
		{create: m.action_create, update: m.action_update, delete: m.action_delete}[action]()
	)
	let hint = $derived(
		isDeclared(collection)
			? m.permission_hint({action: actionName, type: typeLabel(collection)})
			: m.permission_hint_all({action: actionName})
	)
</script>

{#if locked}
	<enform-lock title={hint}>
		<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
			<path d="M7 11V8a5 5 0 0 1 10 0v3M6 11h12v9H6z" />
		</svg>
		<span>{hint}</span>
	</enform-lock>
{/if}
