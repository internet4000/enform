<script lang="ts">
	// More: your account and profiles, writes waiting, language, and what enform is
	import * as m from '#lib/paraglide/messages.js'
	import {getLocale, locales, setLocale, type Locale} from '#lib/paraglide/runtime.js'
	import {inApp} from '#lib/paths'
	import app from '#lib/config/app.json' with {type: 'json'}
	import Account from '#lib/components/Account.svelte'
	import LocalProfiles from '#lib/components/LocalProfiles.svelte'
	import Outbox from '#lib/components/Outbox.svelte'

	const names = new Intl.DisplayNames([getLocale()], {type: 'language'})
</script>

<enform-page>
	<h1>{m.nav_more()}</h1>
	<section aria-labelledby="account">
		<h2 id="account">{m.account_title()}</h2>
		<Account returnTo={inApp('/more')} />
	</section>
	<section aria-labelledby="waiting-title" id="waiting">
		<h2 id="waiting-title">{m.outbox_title()}</h2>
		<Outbox />
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
	<section aria-labelledby="about">
		<h2 id="about">{m.about_title()}</h2>
		<p>{m.app_intro()}</p>
		<ul>
			<li><a href={app.source} rel="noopener noreferrer">{m.about_source()}</a></li>
			<li>
				<a href={`${app.source}/blob/main/docs/self-host.md`} rel="noopener noreferrer"
					>{m.about_self_host()}</a
				>
			</li>
		</ul>
	</section>
</enform-page>
