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
	import Reader from '#lib/components/reader/Reader.svelte'
	import app from '#lib/config/app.json' with {type: 'json'}
	import {inApp} from '#lib/paths'

	let {children} = $props()

	/** Sends the writes waiting for the current account, then shows them as sent */
	async function send() {
		if ((await sendWaiting()) > 0) await refreshAll()
	}

	onMount(() => {
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

<enform-app>
	<header>
		<a href={inApp('/')}>{app.name}</a>
		{#if outbox.writes.length}
			<a href={inApp('/settings#waiting')} rel="status"
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
