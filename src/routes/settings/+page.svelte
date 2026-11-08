<script lang="ts">
	// Settings, opened from who you are: you, your profiles (on this device or atproto
	// accounts) to switch between or add, your pinned apps, writes waiting, language, and
	// what enform is
	import * as m from '#lib/paraglide/messages.js'
	import {getLocale, locales, setLocale, type Locale} from '#lib/paraglide/runtime.js'
	import {inApp} from '#lib/paths'
	import app from '#lib/config/app.json' with {type: 'json'}
	import {auth} from '#lib/auth/session.svelte'
	import AccountList from '#lib/components/AccountList.svelte'
	import LocalProfiles from '#lib/components/LocalProfiles.svelte'
	import Outbox from '#lib/components/Outbox.svelte'
	import PinList from '#lib/components/PinList.svelte'
	import SignIn from '#lib/components/SignIn.svelte'
	import You from '#lib/components/You.svelte'

	const names = new Intl.DisplayNames([getLocale()], {type: 'language'})
</script>

<enform-page>
	<h1>{m.nav_settings()}</h1>
	<section aria-labelledby="you">
		<h2 id="you">{m.you_title()}</h2>
		<You />
	</section>
	<section aria-labelledby="profiles-title" id="profiles">
		<h2 id="profiles-title">{m.profiles_title()}</h2>
		<section aria-labelledby="on-device">
			<h3 id="on-device">{m.local_on_device()}</h3>
			<LocalProfiles />
		</section>
		<section aria-labelledby="accounts">
			<h3 id="accounts">{m.profiles_accounts()}</h3>
			{#if auth.accounts.length}<AccountList />{/if}
			{#if auth.ready}
				<SignIn returnTo={inApp('/settings')} adding={!!auth.session} />
			{/if}
		</section>
	</section>
	<section aria-labelledby="pins">
		<h2 id="pins">{m.pins_title()}</h2>
		<PinList />
	</section>
	<section aria-labelledby="waiting-title" id="waiting">
		<h2 id="waiting-title">{m.outbox_title()}</h2>
		<Outbox />
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
