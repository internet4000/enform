<script lang="ts">
	// A repo as it is stored, in panes: the repo (app by app, or one app's), then a
	// collection, then a record. At the app view's addresses, under /data.
	import {page} from '$app/state'
	import * as m from '#lib/paraglide/messages.js'
	import {auth} from '#lib/auth/session.svelte'
	import {blobUrl} from '#lib/atproto/repo'
	import {personCard} from '#lib/apps/person'
	import Pane from '#lib/components/pane/Pane.svelte'
	import RepoNav from '#lib/components/pane/RepoNav.svelte'
	import {actorName, dataPath} from '#lib/paths'

	let {data, children} = $props()
	let actor = $derived(actorName(data.repo))
	let owner = $derived(auth.owns(data.repo))
	/** The app at hand, when one is: only its collections show */
	let app = $derived(page.params.app)

	const who = async () => personCard(await data.apps)
</script>

<enform-panes>
	<Pane title={m.repo_pane_title()} level={1}>
		<enform-identity verified={!!data.repo.handle || undefined}>
			{#await who() then card}
				{#if card?.avatar}<img src={blobUrl(data.repo, card.avatar)} alt="" />{/if}
				<strong>{card?.title ?? data.repo.name ?? `@${actor}`}</strong>
				{#if card?.title && !data.repo.local}<span>@{actor}</span>{/if}
			{/await}
			{#if data.repo.local}
				<span>{m.local_on_device()}</span>
			{:else}
				<details>
					<summary>{m.repo_details()}</summary>
					<dl>
						<dt>{m.repo_did()}</dt>
						<dd><code>{data.repo.did}</code></dd>
						<dt>{m.repo_pds()}</dt>
						<dd>{new URL(data.repo.pds).host}</dd>
						{#if !data.repo.handle}<dt>{m.repo_handle_unverified()}</dt>{/if}
					</dl>
				</details>
			{/if}
		</enform-identity>
		{#await data.apps}
			<p><small>{m.collection_loading()}</small></p>
		{:then apps}
			{@const shown = app ? apps.filter((one) => one.app === app) : apps}
			<RepoNav repo={data.repo} {actor} apps={shown} {owner} />
			{#if app}
				<p><a href={dataPath(actor)}>{m.data_all_apps()}</a></p>
			{/if}
		{/await}
		{#if data.collections.length === 0}
			<p>{m.repo_collections_empty()}</p>
		{/if}
	</Pane>
	{@render children()}
</enform-panes>
