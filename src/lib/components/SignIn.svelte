<script lang="ts">
	// Sign in with a handle, identity only: the first account, or another one
	import {page} from '$app/state'
	import * as m from '#lib/paraglide/messages.js'
	import {auth} from '#lib/auth/session.svelte'

	let {returnTo, adding = false}: {returnTo?: string; adding?: boolean} = $props()

	let handle = $state('')
	let pending = $state(false)
	let failed = $state<string>()

	async function signIn(event: SubmitEvent) {
		event.preventDefault()
		pending = true
		failed = undefined
		try {
			const back = returnTo ?? page.url.pathname + page.url.search
			await auth.addAccount(handle.trim().replace(/^@/, ''), back)
		} catch (err) {
			failed = (err as Error).message
			pending = false
		}
	}
</script>

<enform-sign-in adding={adding || undefined}>
	<p>{adding ? m.accounts_add_hint() : m.session_sign_in_hint()}</p>
	<form onsubmit={signIn}>
		<label>
			{m.session_handle_label()}
			<input
				type="text"
				bind:value={handle}
				placeholder={m.session_handle_placeholder()}
				autocapitalize="off"
				autocomplete="username"
				spellcheck="false"
				inputmode="email"
				enterkeyhint="go"
				required
			/>
		</label>
		<button type="submit" disabled={pending} aria-busy={pending}>
			{adding ? m.accounts_add_submit() : m.session_sign_in()}
		</button>
	</form>
	{#if failed}<p role="alert">{failed}</p>{/if}
</enform-sign-in>
