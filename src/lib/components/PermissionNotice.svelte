<script lang="ts">
	// What enform will ask permission for before this write, and a way to grant it now
	import * as m from '#lib/paraglide/messages.js'
	import {auth} from '#lib/auth/session.svelte'
	import {isDeclared, type RepoAction} from '#lib/auth/scopes'

	let {collection, action}: {collection: string; action: RepoAction} = $props()

	let pending = $state(false)
	let failed = $state<string>()
	let allowed = $derived(auth.canWrite(collection, action))
	let declared = $derived(isDeclared(collection))
	let actionName = $derived(
		{create: m.action_create, update: m.action_update, delete: m.action_delete}[action]()
	)

	async function grant() {
		pending = true
		failed = undefined
		try {
			await auth.authorizeRepo(collection, action)
		} catch (err) {
			failed = (err as Error).message
		} finally {
			pending = false
		}
	}
</script>

{#if auth.session && !allowed}
	<enform-permission declared={declared || undefined}>
		<p>
			{declared
				? m.permission_collection({action: actionName, collection})
				: m.permission_all_collections({action: actionName, collection})}
		</p>
		<button type="button" onclick={grant} disabled={pending} aria-busy={pending}>
			{m.permission_grant()}
		</button>
		{#if failed}<p role="alert">{failed}</p>{/if}
	</enform-permission>
{/if}
