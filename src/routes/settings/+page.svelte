<script lang="ts">
	import * as m from '#lib/paraglide/messages.js'
	import {getLocale, locales, setLocale, type Locale} from '#lib/paraglide/runtime.js'
	import Account from '#lib/components/Account.svelte'

	const names = new Intl.DisplayNames([getLocale()], {type: 'language'})
</script>

<h1>{m.nav_settings()}</h1>
<section aria-labelledby="account">
	<h2 id="account">{m.account_title()}</h2>
	<Account returnTo="/settings" />
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
