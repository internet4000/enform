<script lang="ts">
	// Settings, opened from who you are, as Bluesky's: who you act as, once and large; one
	// row to switch account (the others' faces on it); then plain rows, each to its own
	// page; signing out last
	import * as m from '#lib/paraglide/messages.js'
	import app from '#lib/config/app.json' with {type: 'json'}
	import {version} from '../../../package.json' with {type: 'json'}
	import {getLocale} from '#lib/paraglide/runtime.js'
	import {inApp} from '#lib/paths'
	import {auth} from '#lib/auth/session.svelte'
	import {profileAvatar} from '#lib/atproto/profile'
	import {pins} from '#lib/apps/pins.svelte'
	import {outbox} from '#lib/outbox/outbox.svelte'
	import SettingsLinks, {type SettingsLink} from '#lib/components/SettingsLinks.svelte'
	import SettingsYou from '#lib/components/SettingsYou.svelte'

	/** enform's own icon, beside its page (addresses are after `#`) */
	const logo = app.logo.replace(/^\//, '')
	const language = new Intl.DisplayNames([getLocale()], {type: 'language'}).of(getLocale())

	let me = $derived(auth.me)
	/** The other accounts on their server, by their faces (those on this device have none) */
	let others = $derived(
		auth.accounts
			.filter((account) => account.did !== me?.did && account.identity)
			.slice(0, 4)
			.map((account) => profileAvatar(account.identity!))
	)
	let switching = $derived<SettingsLink[]>([
		{
			href: inApp('/settings/accounts'),
			icon: 'accounts',
			label: me ? m.accounts_switch_title() : m.session_sign_in(),
			faces: others
		}
	])
	let rows = $derived<SettingsLink[]>([
		{href: inApp('/settings/privacy'), icon: 'lock', label: m.privacy_title()},
		{
			href: inApp('/settings/pins'),
			icon: 'pin',
			label: m.pins_title(),
			value: pins.keys.length ? String(pins.keys.length) : undefined
		},
		...(outbox.writes.length
			? [
					{
						href: inApp('/settings/waiting'),
						icon: 'waiting',
						label: m.outbox_title(),
						value: String(outbox.writes.length)
					} satisfies SettingsLink
				]
			: []),
		{href: inApp('/settings/language'), icon: 'language', label: m.locale_label(), value: language},
		{href: inApp('/settings/feedback'), icon: 'post', label: m.feedback_title()},
		{href: inApp('/settings/about'), icon: 'info', label: m.about_title()}
	])
	let leaving = $derived<SettingsLink[]>(
		me && !me.local && auth.session
			? [{icon: 'signout', label: m.session_sign_out(), onclick: () => auth.signOut()}]
			: []
	)
</script>

<enform-page>
	<h1>{m.nav_settings()}</h1>
	<SettingsYou />
	<SettingsLinks items={switching} />
	<SettingsLinks items={rows} />
	{#if leaving.length}<SettingsLinks items={leaving} />{/if}
	<footer>
		<a href={inApp('/settings/about')}><img src={logo} alt="" />{app.name}</a>
		<small>{m.app_version({version})}</small>
	</footer>
</enform-page>
