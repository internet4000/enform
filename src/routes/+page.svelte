<script lang="ts">
	// Home: your apps (the pinned ones first, in your order), opened like on a phone, what
	// you make most in them (quick actions, from their lexicons), and apps to start;
	// signed out, the way in
	import * as m from '#lib/paraglide/messages.js'
	import {auth} from '#lib/auth/session.svelte'
	import {listCollections} from '#lib/atproto/repo'
	import {repoApps} from '#lib/apps/apps'
	import {appInfo, directoryApps, typeLabel} from '#lib/apps/directory'
	import {quickActions} from '#lib/apps/quick'
	import type {RepoApp} from '#lib/apps/types'
	import {kindVerb} from '#lib/records/kind-words'
	import {namespaceOfDomain} from '#lib/apps/names'
	import {pins} from '#lib/apps/pins.svelte'
	import {pinnedProfile} from '#lib/apps/pinned'
	import AppIconLink from '#lib/components/launcher/AppIconLink.svelte'
	import QuickLinks, {type QuickLink} from '#lib/components/QuickLinks.svelte'
	import StartChoice from '#lib/components/StartChoice.svelte'
	import {startOnDevice} from '#lib/local/start'
	import {actorName, appPath, appScreenPath, inApp} from '#lib/paths'

	let mine = $derived(
		auth.me
			? listCollections(auth.me).then((collections) => repoApps(auth.me!, collections))
			: undefined
	)
	const directory = directoryApps()
	let pinned = $derived(pins.domains.map((domain) => appInfo(namespaceOfDomain(domain))))

	/** What you make most in your apps, the pinned ones first */
	function quick(actor: string, apps: RepoApp[]): QuickLink[] {
		const rank = (app: RepoApp) => {
			const index = pins.domains.indexOf(appInfo(app.namespace).domain)
			return index < 0 ? pins.domains.length : index
		}
		const sorted = apps
			.filter((app) => !appInfo(app.namespace).protocol)
			.sort((a, b) => rank(a) - rank(b))
		return quickActions(sorted)
			.slice(0, 8)
			.map(({app, type, kind}) => {
				const info = appInfo(app.namespace)
				return {
					href: appScreenPath(actor, info.domain, {type: type.nsid, create: true}),
					domain: info.domain,
					app: info.name,
					verb: kindVerb(kind, typeLabel(type.nsid)).verb,
					detail: typeLabel(type.nsid)
				}
			})
	}
</script>

{#snippet profiles()}
	<!-- The profiles pinned in apps: someone's radio, their posts -->
	{#each pins.profiles as pin (`${pin.did}/${pin.domain}`)}
		{#await pinnedProfile(pin) then profile}
			<AppIconLink
				href={profile.href}
				domain={pin.domain}
				name={profile.app}
				label={profile.actor}
				note={profile.app}
			/>
		{/await}
	{/each}
{/snippet}

<enform-page>
	{#if auth.me}
		{@const actor = actorName(auth.me)}
		<section aria-labelledby="mine">
			<h1 id="mine">{m.person_your_apps()}</h1>
			{#await mine}
				<p><small>{m.collection_loading()}</small></p>
			{:then apps}
				{@const used = (apps ?? [])
					.map((app) => appInfo(app.namespace))
					.filter((info) => !info.protocol && !pins.has(info.domain))}
				{@const yours = [...pinned, ...used]}
				<enform-launcher>
					{#each yours as info (info.namespace)}
						<AppIconLink
							href={appScreenPath(actor, info.domain)}
							domain={info.domain}
							name={info.name}
						/>
					{/each}
					{@render profiles()}
				</enform-launcher>
				{#if yours.length === 0 && !pins.profiles.length}<p>{m.home_no_apps()}</p>{/if}
				<QuickLinks title={m.quick_title()} items={quick(actor, apps ?? [])} />
				<section aria-labelledby="start">
					<h2 id="start">{m.home_start()}</h2>
					<enform-launcher>
						{#each directory.filter((info) => !yours.some((app) => app.namespace === info.namespace)) as info (info.namespace)}
							<AppIconLink href={appPath(info.domain)} domain={info.domain} name={info.name} />
						{/each}
						<enform-app-link add>
							<a href={inApp('/explore')}
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
			{#each [...pinned, ...directory.filter((info) => !pins.has(info.domain))] as info (info.namespace)}
				<AppIconLink href={appPath(info.domain)} domain={info.domain} name={info.name} />
			{/each}
			{@render profiles()}
		</enform-launcher>
		<p><a href={inApp('/explore')}>{m.home_more_apps()}</a></p>
		<section aria-labelledby="where">
			<h2 id="where">{m.start_title()}</h2>
			<StartChoice start={() => startOnDevice(m.local_default_name()).then(() => {})} />
		</section>
	{/if}
</enform-page>
