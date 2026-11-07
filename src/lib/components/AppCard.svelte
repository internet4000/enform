<script lang="ts">
	// An app of the atmosphere: what it is, and whether you're on it yet
	import * as m from '#lib/paraglide/messages.js'
	import type {AppInfo} from '#lib/apps/directory'
	import AppIcon from './pane/AppIcon.svelte'
	import {appPath} from '#lib/paths'
	import {plural} from '#lib/plural'

	type Props = {app: AppInfo; joined?: boolean; type?: string; count?: number}
	let {app, joined, type, count}: Props = $props()

	const typesCount = (n: number) =>
		plural(n, {
			one: () => m.apps_types_count_one({count: String(n)}),
			other: () => m.apps_types_count({count: String(n)})
		})
</script>

<enform-app-card joined={joined || undefined}>
	<a href={appPath(app.domain, type)}>
		<AppIcon domain={app.domain} name={app.name} />
		<strong>{app.name}</strong>
		{#if app.description}<p>{app.description}</p>{/if}
		<small>
			{#if joined}{m.apps_joined()}{:else if count}{typesCount(count)}{:else}{app.domain}{/if}
		</small>
	</a>
</enform-app-card>
