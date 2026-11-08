<script lang="ts">
	// Home: your apps, opened like on a phone, and apps to start; signed out, the way in
	import * as m from '#lib/paraglide/messages.js'
	import {auth} from '#lib/auth/session.svelte'
	import {listCollections} from '#lib/atproto/repo'
	import {repoApps} from '#lib/apps/apps'
	import {appInfo, directoryApps} from '#lib/apps/directory'
	import AppIconLink from '#lib/components/launcher/AppIconLink.svelte'
	import {actorName, appPath, appScreenPath} from '#lib/paths'

	let mine = $derived(
		auth.me
			? listCollections(auth.me).then((collections) => repoApps(auth.me!, collections))
			: undefined
	)
	const directory = directoryApps()
</script>

<enform-page>
	{#if auth.me}
		{@const actor = actorName(auth.me)}
		<section aria-labelledby="mine">
			<h1 id="mine">{m.person_your_apps()}</h1>
			{#await mine}
				<p><small>{m.collection_loading()}</small></p>
			{:then apps}
				{@const used = (apps ?? []).filter((app) => !appInfo(app.namespace).protocol)}
				<enform-launcher>
					{#each used as app (app.namespace)}
						{@const info = appInfo(app.namespace)}
						<AppIconLink
							href={appScreenPath(actor, app.app)}
							domain={info.domain}
							name={info.name}
						/>
					{/each}
				</enform-launcher>
				{#if used.length === 0}<p>{m.home_no_apps()}</p>{/if}
				<section aria-labelledby="start">
					<h2 id="start">{m.home_start()}</h2>
					<enform-launcher>
						{#each directory.filter((info) => !used.some((app) => app.namespace === info.namespace)) as info (info.namespace)}
							<AppIconLink href={appPath(info.domain)} domain={info.domain} name={info.name} />
						{/each}
						<enform-app-link add>
							<a href="/explore"
								><span aria-hidden="true">…</span><span>{m.home_more_apps()}</span></a
							>
						</enform-app-link>
					</enform-launcher>
				</section>
			{/await}
		</section>
	{:else if auth.ready}
		<enform-home>
			<h1>{m.app_tagline()}</h1>
			<p>{m.app_intro()}</p>
		</enform-home>
		<enform-launcher>
			{#each directory as info (info.namespace)}
				<AppIconLink href={appPath(info.domain)} domain={info.domain} name={info.name} />
			{/each}
		</enform-launcher>
		<p><a href="/explore">{m.home_more_apps()}</a></p>
		<p>{m.home_have_account()} <a href="/settings" role="button">{m.session_sign_in()}</a></p>
	{/if}
</enform-page>
