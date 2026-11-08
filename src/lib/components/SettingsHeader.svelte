<script lang="ts">
	// A settings page's title, with the way back to Settings before it
	import * as m from '#lib/paraglide/messages.js'
	import {inApp} from '#lib/paths'
	import Icon from './shell/Icon.svelte'

	let {title}: {title: string} = $props()
</script>

<enform-settings-header>
	<a href={inApp('/settings')} rel="up" aria-label={m.nav_settings()} title={m.nav_settings()}
		><Icon name="back" /></a
	>
	<h1>{title}</h1>
</enform-settings-header>
