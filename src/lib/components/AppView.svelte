<script lang="ts">
	// An app as a repo has it: its profile, its lists and settings, and, for the owner,
	// what more can be created in it
	import * as m from '#lib/paraglide/messages.js'
	import type {Identity} from '#lib/atproto/identity'
	import type {RepoApp} from '#lib/apps/types'
	import ProfileCard from './ProfileCard.svelte'
	import TypeRows from './TypeRows.svelte'
	import {newPath} from '#lib/paths'

	type Props = {repo: Identity; actor: string; app: RepoApp; owner: boolean}
	let {repo, actor, app, owner}: Props = $props()

	let lists = $derived(app.lists.filter((type) => type.used))
	let singles = $derived(app.singles.filter((type) => type.used && type.record))
	let more = $derived([
		...(app.profile && !app.profile.record ? [app.profile] : []),
		...app.lists.filter((type) => !type.used),
		...app.singles.filter((type) => !type.used)
	])
</script>

<enform-app-view>
	{#if app.profile?.record}
		<ProfileCard {repo} {actor} profile={{...app.profile, record: app.profile.record}} {owner} />
	{:else if owner && app.profile?.lexicon}
		<p>
			<a href={newPath(app.profile.nsid)} role="button">
				{m.app_create_profile({app: app.app})}
			</a>
		</p>
	{/if}

	{#if lists.length}
		<section aria-labelledby="lists">
			<h2 id="lists">{m.app_lists_title()}</h2>
			<TypeRows types={lists} {actor} {owner} />
		</section>
	{/if}

	{#if singles.length}
		<section aria-labelledby="settings">
			<h2 id="settings">{m.app_settings_title()}</h2>
			<TypeRows types={singles} {actor} {owner} />
		</section>
	{/if}

	{#if owner && more.length}
		<section aria-labelledby="more">
			<h2 id="more">{m.app_more_title()}</h2>
			<TypeRows types={more} create />
		</section>
	{/if}

	{#if !app.published}
		<p><small>{m.app_unpublished({app: app.app})}</small></p>
	{/if}
</enform-app-view>
