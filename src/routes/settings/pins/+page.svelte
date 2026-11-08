<script lang="ts">
	// Your pinned apps, on this device: reordered or unpinned
	import * as m from '#lib/paraglide/messages.js'
	import PinList from '#lib/components/PinList.svelte'
	import SettingsHeader from '#lib/components/SettingsHeader.svelte'
</script>

<enform-page>
	<SettingsHeader title={m.pins_title()} />
	<PinList />
</enform-page>
