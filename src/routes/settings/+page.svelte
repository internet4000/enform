<script lang="ts">
	// Settings, opened from who you are: only where to go, in groups of rows (as 4000.radio's
	// and joblist's menus), each to its own page. You (your page, your profiles and
	// accounts, signing out), this browser (pins, writes waiting, language), and enform
	import * as m from '#lib/paraglide/messages.js'
	import {getLocale} from '#lib/paraglide/runtime.js'
	import {inApp, actorName, repoPath} from '#lib/paths'
	import app from '#lib/config/app.json' with {type: 'json'}
	import {auth} from '#lib/auth/session.svelte'
	import {profileAvatar} from '#lib/atproto/profile'
	import {pins} from '#lib/apps/pins.svelte'
	import {outbox} from '#lib/outbox/outbox.svelte'
	import SettingsLinks, {type SettingsLink} from '#lib/components/SettingsLinks.svelte'

	const language = new Intl.DisplayNames([getLocale()], {type: 'language'}).of(getLocale())

	let me = $derived(auth.me)
	let you = $derived.by((): SettingsLink[] => {
		const profiles: SettingsLink = {
			href: inApp('/settings/profiles'),
			icon: 'profile',
			label: m.profiles_title(),
			value: me ? (me.local ? m.local_on_device() : me.pds && new URL(me.pds).host) : undefined
		}
		if (!me) return [profiles]
		const actor = actorName(me)
		const page: SettingsLink = {
			href: repoPath(actor),
			icon: 'me',
			label: me.local ? (me.name ?? m.local_on_device()) : `@${actor}`,
			value: m.account_your_page(),
			image: me.local ? undefined : profileAvatar(me)
		}
		const leave: SettingsLink[] = me.local
			? auth.identity
				? [
						{
							icon: 'me',
							label: m.you_use_account({actor: `@${actorName(auth.identity)}`}),
							onclick: () => auth.useLocal(undefined)
						}
					]
				: []
			: [{icon: 'signout', label: m.session_sign_out(), onclick: () => auth.signOut()}]
		const handle: SettingsLink[] = me.local
			? []
			: [{href: inApp('/settings/handle'), icon: 'handle', label: m.handle_title()}]
		return [page, ...handle, profiles, ...leave]
	})
	let browser = $derived<SettingsLink[]>([
		{
			href: inApp('/settings/pins'),
			icon: 'pin',
			label: m.pins_title(),
			value: pins.domains.length ? String(pins.domains.length) : undefined
		},
		{
			href: inApp('/settings/waiting'),
			icon: 'waiting',
			label: m.outbox_title(),
			value: outbox.writes.length ? String(outbox.writes.length) : undefined
		},
		{href: inApp('/settings/language'), icon: 'language', label: m.locale_label(), value: language}
	])
	const about: SettingsLink[] = [
		{href: inApp('/settings/feedback'), icon: 'post', label: m.feedback_title()},
		{href: app.source, icon: 'source', label: m.about_source(), external: true},
		{
			href: `${app.source}/blob/main/docs/self-host.md`,
			icon: 'home',
			label: m.about_self_host(),
			external: true
		}
	]
</script>

<enform-page>
	<h1>{m.nav_settings()}</h1>
	<SettingsLinks title={m.you_title()} items={you} />
	{#if !me && auth.ready}<p><small>{m.you_nobody()}</small></p>{/if}
	<SettingsLinks title={m.settings_browser()} items={browser} />
	<SettingsLinks title={m.about_title()} items={about} />
	<p><small>{m.app_intro()}</small></p>
</enform-page>
