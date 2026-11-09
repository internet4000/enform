<script lang="ts">
	// Feedback on enform, from the person's own accounts: feedbai's form (static/feedbai.js,
	// served from here as the CSP allows only enform's own scripts). It opens a prefilled chat
	// message, Bluesky post or GitHub issue for them to send: nothing goes through us. The page
	// they came from is attached, and they can remove it.
	import * as m from '#lib/paraglide/messages.js'
	import {onMount} from 'svelte'
	import {afterNavigate} from '$app/navigation'
	import {asset} from '$app/paths'
	import app from '#lib/config/app.json' with {type: 'json'}
	import SettingsHeader from '#lib/components/SettingsHeader.svelte'

	let from = $state<string>()
	let ready = $state(false)
	afterNavigate(({from: previous}) => {
		if (previous?.url) from = previous.url.origin + previous.url.pathname
	})
	onMount(async () => {
		await import(/* @vite-ignore */ asset('feedbai.js'))
		ready = true
	})
</script>

<enform-page>
	<SettingsHeader title={m.feedback_title()} />
	<p>{m.feedback_intro()}</p>
	{#if ready}
		<feedbai-button
			inline
			project={app.source}
			matrix={app.feedback.matrix}
			bluesky={app.feedback.bluesky}
			page={from ?? ''}
		></feedbai-button>
	{/if}
</enform-page>
