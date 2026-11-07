<script lang="ts">
	// An app of the atmosphere: what it is, and whether you're on it yet
	import * as m from '#lib/paraglide/messages.js'
	import type {AppInfo} from '#lib/apps/directory'
	import AppIcon from './pane/AppIcon.svelte'
	import {appPath} from '#lib/paths'

	let {app, joined}: {app: AppInfo; joined?: boolean} = $props()
</script>

<enform-app-card joined={joined || undefined}>
	<a href={appPath(app.domain)}>
		<AppIcon domain={app.domain} name={app.name} />
		<strong>{app.name}</strong>
		{#if app.description}<p>{app.description}</p>{/if}
		<small>{joined ? m.apps_joined() : app.domain}</small>
	</a>
</enform-app-card>
