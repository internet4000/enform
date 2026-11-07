<script lang="ts">
	// Follow or unfollow a repo, or one of its collections, as a record in your own repo
	import * as m from '#lib/paraglide/messages.js'
	import {auth} from '#lib/auth/session.svelte'
	import {follows} from '#lib/follows/follows.svelte'

	let {subject, collection}: {subject: string; collection?: string} = $props()

	let pending = $state(false)
	let failed = $state<string>()
	let current = $derived(follows.find(subject, collection))

	async function toggle() {
		pending = true
		failed = undefined
		try {
			if (current) await follows.unfollow(current)
			else await follows.follow(subject, collection)
		} catch (err) {
			failed = (err as Error).message
		} finally {
			pending = false
		}
	}
</script>

{#if auth.session && auth.session.did !== subject && follows.loaded}
	<enform-follow following={!!current || undefined}>
		<button type="button" onclick={toggle} disabled={pending} aria-pressed={!!current}>
			{current ? m.follow_following() : collection ? m.follow_collection() : m.follow_repo()}
		</button>
		{#if failed}<p role="alert">{failed}</p>{/if}
	</enform-follow>
{/if}
