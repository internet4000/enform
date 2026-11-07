<script lang="ts">
	// A repo as panes: the repo (app by app), then a collection, then a record
	import * as m from '#lib/paraglide/messages.js'
	import {auth} from '#lib/auth/session.svelte'
	import {blobUrl} from '#lib/atproto/repo'
	import {recordCard} from '#lib/records/card'
	import Pane from '#lib/components/pane/Pane.svelte'
	import RepoNav from '#lib/components/pane/RepoNav.svelte'
	import {actorName} from '#lib/paths'

	let {data, children} = $props()
	let actor = $derived(actorName(data.repo))
	let owner = $derived(auth.session?.did === data.repo.did)

	/** Who this is: the first app profile with a name or picture, Bluesky's first */
	async function who() {
		const apps = await data.apps
		const profiles = apps
			.map((app) => app.profile)
			.filter((profile) => profile?.record)
			.sort(
				(a, b) =>
					Number(b?.nsid === 'app.bsky.actor.profile') -
					Number(a?.nsid === 'app.bsky.actor.profile')
			)
		const profile = profiles[0]
		return profile?.record
			? recordCard(profile.record.value, profile.lexicon?.defs.main?.record)
			: undefined
	}
</script>

<enform-panes>
	<Pane title={`@${actor}`}>
		<enform-identity verified={!!data.repo.handle || undefined}>
			{#await who() then card}
				{#if card?.avatar}<img src={blobUrl(data.repo, card.avatar)} alt="" />{/if}
				{#if card?.title}<strong>{card.title}</strong>{/if}
			{/await}
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
