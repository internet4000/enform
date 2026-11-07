<script lang="ts">
	import * as m from '#lib/paraglide/messages.js'
	import {groupByApp} from '#lib/collections'
	import ProfileCard from '#lib/components/ProfileCard.svelte'
	import {auth} from '#lib/auth/session.svelte'
	import {profileKey} from '#lib/lexicons/kind'
	import {actorName, collectionPath, editPath, newPath, recordPath} from '#lib/paths'

	let {data} = $props()
	let actor = $derived(actorName(data.repo))
	let owner = $derived(auth.session?.did === data.repo.did)
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
					<ProfileCard repo={data.repo} {actor} {profile} {owner} />
				{/each}
				{#if app.collections.length}
					<ul>
						{#each app.collections as collection (collection.nsid)}
							{@const key = collection.lexicon && profileKey(collection.lexicon)}
							<li>
								<!-- A one-record collection opens its record; others list theirs -->
								<a
									href={key
										? recordPath(actor, collection.nsid, key)
										: collectionPath(actor, collection.nsid)}
								>
									<span>{collection.nsid}</span>
									<small>{collection.lexicon?.defs.main?.description ?? ''}</small>
								</a>
								{#if owner && collection.lexicon}
									{#if key}
										<a href={editPath(actor, collection.nsid, key)}>{m.record_edit()}</a>
									{:else}
										<a
											href={newPath(collection.nsid)}
											aria-label={m.collection_add_to({collection: collection.nsid})}
										>
											{m.collection_add()}
										</a>
									{/if}
								{/if}
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
