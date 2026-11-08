<script lang="ts">
	// Writes to your account not sent yet
	import * as m from '#lib/paraglide/messages.js'
	import Outbox from '#lib/components/Outbox.svelte'
	import SettingsHeader from '#lib/components/SettingsHeader.svelte'
</script>

<enform-page>
	<SettingsHeader title={m.outbox_title()} />
	<Outbox />
</enform-page>
