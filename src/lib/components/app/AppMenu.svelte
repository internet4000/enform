<script lang="ts">
	// An app's occasional links, in a menu beside its name: the app itself, what it is
	// (its page), and its data as stored
	import * as m from '#lib/paraglide/messages.js'
	import type {AppInfo} from '#lib/apps/directory'
	import {appPath} from '#lib/paths'

	let {info, data}: {info: AppInfo; data: string} = $props()
	const id = $props.id()
</script>

<button type="button" popovertarget="{id}-app" aria-label={m.record_menu()}>⋯</button>
<enform-menu id="{id}-app" popover="auto">
	<ul>
		{#if info.url}
			<li>
				<a href={info.url} rel="noopener external" target="_blank"
					>{m.apps_visit({domain: info.domain})} ↗</a
				>
			</li>
		{/if}
		<li><a href={appPath(info.domain)}>{m.app_about({app: info.name})}</a></li>
		<li><a href={data}>{m.app_stored_data()}</a></li>
	</ul>
</enform-menu>
