<script lang="ts">
	// Pins an app, or a profile in it, or unpins it: in the rail and first on Home, on this
	// device. An icon, filled when pinned; its label says what it pins
	import * as m from '#lib/paraglide/messages.js'
	import {pins} from '#lib/apps/pins.svelte'
	import Icon from './shell/Icon.svelte'

	type Props = {
		domain: string
		name: string
		/** A profile in the app: its account's DID, and its handle to say which */
		did?: string
		actor?: string
	}
	let {domain, name, did, actor}: Props = $props()
	let pinned = $derived(pins.has(domain, did))
	let label = $derived(
		did
			? (pinned ? m.unpin_profile : m.pin_profile)({actor: actor ?? did, app: name})
			: (pinned ? m.unpin_app : m.pin_app)({app: name})
	)
</script>

<button
	type="button"
	data-pin
	aria-pressed={pinned}
	aria-label={label}
	title={label}
	onclick={() => pins.toggle(domain, did)}
>
	<Icon name="pin" />
</button>
