<script lang="ts">
	import '../styles/index.css'
	import {onMount} from 'svelte'
	import {goto} from '$app/navigation'
	import {navigating} from '$app/state'
	import {startAuth} from '#lib/auth/session.svelte'
	import SessionMenu from '#lib/components/SessionMenu.svelte'
	import * as m from '#lib/paraglide/messages.js'
	import {getLocale, locales, setLocale, type Locale} from '#lib/paraglide/runtime.js'
	import app from '#lib/config/app.json' with {type: 'json'}

	let {children} = $props()

	const names = new Intl.DisplayNames([getLocale()], {type: 'language'})

	onMount(() => {
		startAuth().then((returnTo) => {
			if (returnTo) goto(returnTo, {replaceState: true})
		})
	})
</script>

<svelte:head>
	<title>{app.name}</title>
</svelte:head>

<enform-app>
	<header>
		<a href="/">{app.name}</a>
		<SessionMenu />
		<label>
			{m.locale_label()}
			<select
				value={getLocale()}
				onchange={(event) => setLocale(event.currentTarget.value as Locale)}
			>
				{#each locales as locale (locale)}
					<option value={locale}>{names.of(locale)}</option>
				{/each}
			</select>
		</label>
	</header>
	<main aria-busy={!!navigating.to}>
		{@render children()}
	</main>
</enform-app>
