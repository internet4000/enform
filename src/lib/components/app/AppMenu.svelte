<script lang="ts">
	// An app's occasional links, in a menu beside its name: the app itself, what it is
	// (its page), its data as stored, and, on someone's profile in it, how to embed it
	import * as m from '#lib/paraglide/messages.js'
	import type {AppInfo} from '#lib/apps/directory'
	import {appPath} from '#lib/paths'
	import EmbedDialog from './EmbedDialog.svelte'

	type Props = {info: AppInfo; data: string; /** Whose profile, to embed it */ actor?: string}
	let {info, data, actor}: Props = $props()
	const id = $props.id()
	let embed = $state<EmbedDialog>()
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
		{#if actor}
			<li>
				<button
					type="button"
					onclick={() => {
						document.getElementById(`${id}-app`)?.hidePopover()
						embed?.open()
					}}>{m.embed_menu()}</button
				>
			</li>
		{/if}
	</ul>
</enform-menu>
{#if actor}
	<EmbedDialog bind:this={embed} {actor} domain={info.domain} name={info.name} />
{/if}
