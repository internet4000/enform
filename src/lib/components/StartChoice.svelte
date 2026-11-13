<script lang="ts">
	// The two places your records can be kept, said plainly, to start with either: this
	// device (no account, offline) or an atproto account (its server, other apps read it)
	import * as m from '#lib/paraglide/messages.js'
	import {inApp} from '#lib/paths'
	import SignIn from './SignIn.svelte'

	type Props = {
		start: () => Promise<void>
		/** Sign in here, back to this page after, instead of from Settings */
		inline?: boolean
	}
	let {start, inline = false}: Props = $props()
	let pending = $state(false)

	async function onDevice() {
		pending = true
		try {
			await start()
		} finally {
			pending = false
		}
	}
</script>

<enform-start-choice>
	<ul>
		<li>
			<h3>{m.local_on_device()}</h3>
			<p>{m.start_device()}</p>
			<button type="button" onclick={onDevice} disabled={pending} aria-busy={pending}
				>{m.start_device_button()}</button
			>
		</li>
		<li>
			<h3>{m.start_account_title()}</h3>
			<p>{m.start_account()}</p>
			{#if inline}
				<SignIn />
			{:else}
				<a href={inApp('/settings/accounts')} role="button">{m.session_sign_in()}</a>
			{/if}
		</li>
	</ul>
	<p><small>{m.start_later()}</small></p>
</enform-start-choice>
