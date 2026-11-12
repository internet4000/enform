<script lang="ts">
	import '../styles/index.css'
	import {onMount} from 'svelte'
	import {goto, refreshAll} from '$app/navigation'
	import {navigating, page} from '$app/state'
	import * as m from '#lib/paraglide/messages.js'
	import {startAuth} from '#lib/auth/session.svelte'
	import {sendWaiting} from '#lib/atproto/write'
	import {outbox} from '#lib/outbox/outbox.svelte'
	import AppNav from '#lib/components/shell/AppNav.svelte'
	import Search from '#lib/components/shell/Search.svelte'
	import Reader from '#lib/components/reader/Reader.svelte'
	import app from '#lib/config/app.json' with {type: 'json'}
	import {inApp} from '#lib/paths'
	import {finishPopup} from '#lib/auth/client'
	import {isPopupCallback, refused} from '#lib/auth/popup'

	let {children} = $props()

	/** A permission's answer, back in its popup: what happened, not the app */
	const popup = isPopupCallback()
	const said = popup && refused() ? 'refused' : 'given'
	/** Still there once the answer is handed over: closing it is left to the person */
	let stayed = $state(false)
	/** Why the answer couldn't be handed to the page that asked */
	let failed = $state<string>()

	/** Sends the writes waiting for the current account, then shows them as sent */
	async function send() {
		if ((await sendWaiting()) > 0) await refreshAll()
	}

	onMount(() => {
		if (popup) {
			finishPopup().then((error) => {
				failed = error
				setTimeout(() => (stayed = true), error ? 0 : 1000)
			})
			return
		}
		startAuth().then(async (returnTo) => {
			if (returnTo) await goto(returnTo, {replace: true})
			await outbox.refresh()
			await send()
		})
		window.addEventListener('online', send)
		return () => window.removeEventListener('online', send)
	})
</script>

<svelte:head>
	<title>{app.name}</title>
	<meta name="description" content={m.app_intro()} />
	<link rel="canonical" href={`${page.url.origin}${page.url.pathname}`} />
</svelte:head>

{#if popup}
	<enform-popup>
		<h1>{app.name}</h1>
		<p role="status">
			{#if failed}
				{m.popup_failed({error: failed})}
			{:else if said === 'refused'}
				{m.popup_refused()}
			{:else if stayed}
				{m.popup_given()}
			{:else}
				{m.popup_working()}
			{/if}
		</p>
		{#if stayed || said === 'refused'}
			<p><button type="button" onclick={() => window.close()}>{m.popup_close()}</button></p>
		{/if}
	</enform-popup>
{:else}
	<enform-app>
		<header>
			<Search />
			{#if outbox.writes.length}
				<a href={inApp('/settings/waiting')} rel="status"
					>{m.outbox_count({count: String(outbox.writes.length)})}</a
				>
			{/if}
		</header>
		<main aria-busy={!!navigating.to}>
			{@render children()}
		</main>
		<Reader />
		<AppNav />
	</enform-app>
{/if}
