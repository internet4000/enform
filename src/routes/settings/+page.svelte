<script lang="ts">
	import * as m from '#lib/paraglide/messages.js'
	import {getLocale, locales, setLocale, type Locale} from '#lib/paraglide/runtime.js'
	import Account from '#lib/components/Account.svelte'
	import LocalProfiles from '#lib/components/LocalProfiles.svelte'

	const names = new Intl.DisplayNames([getLocale()], {type: 'language'})
</script>

<enform-page>
	<h1>{m.nav_settings()}</h1>
	<section aria-labelledby="account">
		<h2 id="account">{m.account_title()}</h2>
		<Account returnTo="/settings" />
	</section>
	<section aria-labelledby="local">
		<h2 id="local">{m.local_title()}</h2>
		<LocalProfiles />
	</section>
	<section aria-labelledby="language">
		<h2 id="language">{m.locale_label()}</h2>
		<select
			aria-labelledby="language"
			value={getLocale()}
			onchange={(event) => setLocale(event.currentTarget.value as Locale)}
		>
			{#each locales as locale (locale)}
				<option value={locale}>{names.of(locale)}</option>
			{/each}
		</select>
	</section>
</enform-page>
