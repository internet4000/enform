<script lang="ts">
	// What you follow: the latest records of followed collections, and followed repos
	import {AtUri} from '@atproto/syntax'
	import * as m from '#lib/paraglide/messages.js'
	import {auth} from '#lib/auth/session.svelte'
	import {resolveIdentity} from '#lib/atproto/identity'
	import Account from '#lib/components/Account.svelte'
	import {followingFeed} from '#lib/follows/feed'
	import {follows} from '#lib/follows/follows.svelte'
	import {formatDate} from '#lib/dates'
	import {actorName, collectionPath, recordPath, repoPath} from '#lib/paths'
	import {recordSummary} from '#lib/records/summary'
	import app from '#lib/config/app.json' with {type: 'json'}

	let feed = $derived(follows.loaded ? followingFeed(follows.list, app.reads.feedSize) : undefined)
	let repos = $derived(follows.list.filter((follow) => !follow.collection))
</script>

<h1>{m.nav_following()}</h1>

{#if !auth.session}
	{#if auth.ready}
		<p>{m.following_sign_in()}</p>
		<Account />
	{/if}
{:else if follows.loaded && follows.list.length === 0}
	<p>{m.following_empty()}</p>
{:else}
	{#if repos.length}
		<section aria-labelledby="repos">
			<h2 id="repos">{m.following_repos()}</h2>
			<enform-home>
				<ul>
					{#each repos as follow (follow.rkey)}
						{#await resolveIdentity(follow.subject)}
							<li><a href={repoPath(follow.subject)}>{follow.subject}</a></li>
						{:then repo}
							<li><a href={repoPath(actorName(repo))}>@{actorName(repo)}</a></li>
						{:catch}
							<li><a href={repoPath(follow.subject)}>{follow.subject}</a></li>
						{/await}
					{/each}
				</ul>
			</enform-home>
		</section>
	{/if}
	<section aria-labelledby="latest">
		<h2 id="latest">{m.following_latest()}</h2>
		<enform-records>
			{#await feed}
				<p>{m.collection_loading()}</p>
			{:then items}
				<ol>
					{#each items ?? [] as item (item.record.uri)}
						{@const actor = actorName(item.repo)}
						<li>
							<a href={recordPath(actor, item.collection, new AtUri(item.record.uri).rkey)}>
								<p>{recordSummary(item.record.value) ?? item.collection}</p>
								<small>
									@{actor} · {item.collection}
									{#if item.date}· <time datetime={item.date}>{formatDate(item.date)}</time>{/if}
								</small>
							</a>
						</li>
					{:else}
						<li>{m.following_feed_empty()}</li>
					{/each}
				</ol>
			{/await}
		</enform-records>
	</section>
	<details>
		<summary>{m.following_collections({count: String(follows.list.length - repos.length)})}</summary
		>
		<ul>
			{#each follows.list.filter((f) => f.collection) as follow (follow.rkey)}
				<li>
					<a href={collectionPath(follow.subject, follow.collection as string)}>
						{follow.subject} / {follow.collection}
					</a>
				</li>
			{/each}
		</ul>
	</details>
{/if}
