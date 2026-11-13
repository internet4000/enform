<script lang="ts">
	// An app's occasional links, in a menu beside its name: the app itself, what it is
	// (its page, unless one is on it), its data as stored, and, on someone's profile in it,
	// how to embed it
	import * as m from '#lib/paraglide/messages.js'
	import type {AppInfo} from '#lib/apps/directory'
	import {appPath} from '#lib/paths'
	import EmbedDialog from './EmbedDialog.svelte'

	type Props = {
		info: AppInfo
		/** Its data as stored, on someone's profile in it */
		data?: string
		/** Whose profile, to embed it */
		actor?: string
		/** On the app's own page: no link to it */
		about?: boolean
	}
	let {info, data, actor, about = true}: Props = $props()
	const id = $props.id()
	let embed = $state<EmbedDialog>()
</script>

<button
	type="button"
	popovertarget="{id}-app"
	style:anchor-name="--{id}-app"
	aria-label={m.record_menu()}>⋯</button
>
<enform-menu id="{id}-app" popover="auto" style:position-anchor="--{id}-app">
	<ul>
		{#if info.url}
			<li>
				<a href={info.url} rel="noopener external" target="_blank"
					>{m.apps_visit({domain: info.domain})} ↗</a
				>
			</li>
		{/if}
		{#if about}
			<li><a href={appPath(info.domain)}>{m.app_about({app: info.name})}</a></li>
		{/if}
		{#if data}<li><a href={data}>{m.app_stored_data()}</a></li>{/if}
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
