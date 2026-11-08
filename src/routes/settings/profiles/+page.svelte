<script lang="ts">
	// Your profiles: who you act as and where your records are kept (with what enform may do
	// on your account), then the profiles on this device and the atproto accounts to switch
	// between or add
	import * as m from '#lib/paraglide/messages.js'
	import {inApp} from '#lib/paths'
	import {auth} from '#lib/auth/session.svelte'
	import AccountList from '#lib/components/AccountList.svelte'
	import LocalProfiles from '#lib/components/LocalProfiles.svelte'
	import SettingsHeader from '#lib/components/SettingsHeader.svelte'
	import SignIn from '#lib/components/SignIn.svelte'
	import You from '#lib/components/You.svelte'
</script>

<enform-page>
	<SettingsHeader title={m.profiles_title()} />
	<You />
	<section aria-labelledby="on-device">
		<h2 id="on-device">{m.local_on_device()}</h2>
		<LocalProfiles />
	</section>
	<section aria-labelledby="accounts">
		<h2 id="accounts">{m.profiles_accounts()}</h2>
		{#if auth.accounts.length}<AccountList />{/if}
		{#if auth.ready}
			<SignIn returnTo={inApp('/settings/profiles')} adding={!!auth.session} />
		{/if}
	</section>
</enform-page>
