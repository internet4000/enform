<script lang="ts">
	import '../styles/index.css'
	import {onMount} from 'svelte'
	import {goto} from '$app/navigation'
	import {navigating} from '$app/state'
	import {auth, startAuth} from '#lib/auth/session.svelte'
	import {follows} from '#lib/follows/follows.svelte'
	import AppNav from '#lib/components/shell/AppNav.svelte'
	import app from '#lib/config/app.json' with {type: 'json'}

	let {children} = $props()

	// The signed-in account's follows, for follow buttons and the Following feed
	$effect(() => {
		follows.load(auth.identity)
	})

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
	</header>
	<main aria-busy={!!navigating.to}>
		{@render children()}
	</main>
	<AppNav />
</enform-app>
