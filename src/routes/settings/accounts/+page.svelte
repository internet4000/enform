<script lang="ts">
	// Switch account: every account on this browser, on its server or on this device, and
	// adding one either way
	import * as m from '#lib/paraglide/messages.js'
	import AccountSwitcher from '#lib/components/AccountSwitcher.svelte'
	import SettingsHeader from '#lib/components/SettingsHeader.svelte'
</script>

<enform-page>
	<SettingsHeader title={m.accounts_switch_title()} />
	<AccountSwitcher />
</enform-page>
