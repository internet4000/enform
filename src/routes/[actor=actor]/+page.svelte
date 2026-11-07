<script lang="ts">
	import * as m from '#lib/paraglide/messages.js'
	import {groupByApp} from '#lib/collections'
	import FollowButton from '#lib/components/FollowButton.svelte'
	import ProfileCard from '#lib/components/ProfileCard.svelte'
	import {actorName, collectionPath} from '#lib/paths'

	let {data} = $props()
	let actor = $derived(actorName(data.repo))
</script>

<enform-repo verified={!!data.repo.handle || undefined}>
	<h1>@{actor}</h1>
	<p>
		<small>
			<code>{data.repo.did}</code> · {m.repo_pds()}
			{new URL(data.repo.pds).host}
			{#if !data.repo.handle}· {m.repo_handle_unverified()}{/if}
		</small>
	</p>
	<FollowButton subject={data.repo.did} />
</enform-repo>

<enform-apps>
	{#await data.apps}
		<!-- Collections by name until their lexicons say what they are -->
		{#each groupByApp(data.collections) as group (group.app)}
			<section>
				<h2>{group.app}</h2>
				<ul>
					{#each group.collections as nsid (nsid)}
						<li><a href={collectionPath(actor, nsid)}>{nsid}</a></li>
					{/each}
				</ul>
			</section>
		{/each}
	{:then apps}
		{#each apps as app (app.app)}
			<section>
				<h2>{app.app}</h2>
				{#each app.profiles as profile (profile.nsid)}
					<ProfileCard repo={data.repo} {actor} {profile} />
				{/each}
				{#if app.collections.length}
					<ul>
						{#each app.collections as collection (collection.nsid)}
							<li>
								<a href={collectionPath(actor, collection.nsid)}>
									<span>{collection.nsid}</span>
									<small>{collection.lexicon?.defs.main?.description ?? ''}</small>
								</a>
							</li>
						{/each}
					</ul>
				{/if}
			</section>
		{/each}
	{/await}
	{#if data.collections.length === 0}
		<p>{m.repo_collections_empty()}</p>
	{/if}
</enform-apps>
