<script lang="ts">
	// An account on an app, in one card: who it is there (its profile in the app), what it
	// has (yours), why it's shown when that isn't obvious, and one way in (its app screen)
	import type {Identity} from '#lib/atproto/identity'
	import {byDirectory, typeLabel} from '#lib/apps/directory'
	import type {RepoApp} from '#lib/apps/types'
	import AppProfile from './AppProfile.svelte'

	type Props = {
		repo: Identity
		app: RepoApp
		href: string
		label: string
		note?: string
		/** What it has, by type: yours, not another's (its shelves show it) */
		types?: boolean
	}
	let {repo, app, href, label, note, types = true}: Props = $props()

	let had = $derived(
		!types
			? []
			: byDirectory(
					[...(app.profile ? [app.profile] : []), ...app.lists, ...app.singles].filter(
						(type) => type.used
					)
				)
	)
</script>

<enform-app-place>
	<AppProfile {repo} {app} />
	{#if had.length || note}
		<p>
			{had.map((type) => typeLabel(type.nsid)).join(' · ')}
			{#if note}<small>{note}</small>{/if}
		</p>
	{/if}
	<a {href} role="button">{label}</a>
</enform-app-place>
