<script lang="ts">
	// A repo as panes: the repo (app by app), then a collection, then a record
	import * as m from '#lib/paraglide/messages.js'
	import {auth} from '#lib/auth/session.svelte'
	import {blobUrl} from '#lib/atproto/repo'
	import {personCard} from '#lib/apps/person'
	import Pane from '#lib/components/pane/Pane.svelte'
	import RepoNav from '#lib/components/pane/RepoNav.svelte'
	import {actorName} from '#lib/paths'

	let {data, children} = $props()
	let actor = $derived(actorName(data.repo))
	let owner = $derived(auth.owns(data.repo))

	const who = async () => personCard(await data.apps)
</script>

<enform-panes>
	<Pane title={m.repo_pane_title()}>
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
			<RepoNav repo={data.repo} {actor} {apps} {owner} />
		{/await}
		{#if data.collections.length === 0}
			<p>{m.repo_collections_empty()}</p>
		{/if}
	</Pane>
	{@render children()}
</enform-panes>
