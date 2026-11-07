<script lang="ts">
	// A repo, app by app: who it is, then each app's profile and lists, named for people.
	// The owner can add to lists, and start the app's other types.
	import {page} from '$app/state'
	import * as m from '#lib/paraglide/messages.js'
	import type {Identity} from '#lib/atproto/identity'
	import {blobUrl} from '#lib/atproto/repo'
	import {appInfo, byDirectory, typeLabel} from '#lib/apps/directory'
	import type {AppType, RepoApp} from '#lib/apps/types'
	import {recordCard} from '#lib/records/card'
	import {collectionPath, createPath, recordPath} from '#lib/paths'
	import AppIcon from './AppIcon.svelte'

	type Props = {repo: Identity; actor: string; apps: RepoApp[]; owner: boolean}
	let {repo, actor, apps, owner}: Props = $props()

	let sorted = $derived(
		apps
			.map((app) => ({app, info: appInfo(app.namespace)}))
			.sort(
				(a, b) =>
					Number(a.info.protocol) - Number(b.info.protocol) ||
					Number(b.info.known) - Number(a.info.known) ||
					a.info.name.localeCompare(b.info.name)
			)
	)

	const current = (nsid: string) => page.params.collection === nsid
	const unused = (app: RepoApp): AppType[] => [
		...(app.profile && !app.profile.record && app.profile.lexicon ? [app.profile] : []),
		...app.lists.filter((type) => !type.used && type.lexicon)
	]
	const card = (app: RepoApp) =>
		app.profile?.record
			? recordCard(app.profile.record.value, app.profile.lexicon?.defs.main?.record)
			: undefined
</script>

<enform-repo-nav>
	{#each sorted as { app, info } (app.namespace)}
		{@const profile = card(app)}
		<enform-repo-app protocol={info.protocol || undefined} role="group" aria-label={info.name}>
			<h2>
				<AppIcon domain={info.domain} name={info.name} />
				<span>{info.name}</span>
			</h2>
			<ul>
				{#if app.profile?.record}
					<li>
						<a
							href={recordPath(actor, app.profile.nsid, app.profile.rkey)}
							aria-current={current(app.profile.nsid) ? 'page' : undefined}
						>
							{#if profile?.avatar}
								<img src={blobUrl(repo, profile.avatar)} alt="" loading="lazy" />
							{/if}
							<span>{profile?.title ?? typeLabel(app.profile.nsid)}</span>
							<small>{typeLabel(app.profile.nsid)}</small>
						</a>
					</li>
				{/if}
				{#each byDirectory(app.lists.filter((type) => type.used)) as type (type.nsid)}
					<li>
						<a
							href={collectionPath(actor, type.nsid)}
							aria-current={current(type.nsid) ? 'page' : undefined}
						>
							<span>{typeLabel(type.nsid)}</span>
						</a>
					</li>
				{/each}
				{#each app.singles.filter((type) => type.used) as type (type.nsid)}
					<li>
						<a
							href={recordPath(actor, type.nsid, type.rkey)}
							aria-current={current(type.nsid) ? 'page' : undefined}
						>
							<span>{typeLabel(type.nsid)}</span>
						</a>
					</li>
				{/each}
				{#if owner && unused(app).length}
					<li>
						<details>
							<summary>{m.nav_start_more({app: info.name})}</summary>
							<ul>
								{#each unused(app) as type (type.nsid)}
									<li>
										<a href={createPath(actor, type.nsid)}>
											<span>{m.nav_start_type({type: typeLabel(type.nsid)})}</span>
										</a>
									</li>
								{/each}
							</ul>
						</details>
					</li>
				{/if}
			</ul>
		</enform-repo-app>
	{/each}
</enform-repo-nav>
