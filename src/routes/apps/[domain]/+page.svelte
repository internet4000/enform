<script lang="ts">
	// An app of the atmosphere: what it is, you on it when you are (your profile there and
	// what you have), what you can make there (editing what you can have only one of),
	// and starting on it
	import * as m from '#lib/paraglide/messages.js'
	import {goto} from '$app/navigation'
	import {localIdentity} from '#lib/atproto/identity'
	import {startOnDevice} from '#lib/local/start'
	import {auth} from '#lib/auth/session.svelte'
	import {listCollections} from '#lib/atproto/repo'
	import {repoApps} from '#lib/apps/apps'
	import {byDirectory, directoryTypes, typeLabel} from '#lib/apps/directory'
	import type {RepoApp} from '#lib/apps/types'
	import {startType} from '#lib/apps/start'
	import {isExample} from '#lib/lexicons/examples/index'
	import SignIn from '#lib/components/SignIn.svelte'
	import StartChoice from '#lib/components/StartChoice.svelte'
	import AppIcon from '#lib/components/pane/AppIcon.svelte'
	import AppActions from '#lib/components/app/AppActions.svelte'
	import AppProfile from '#lib/components/app/AppProfile.svelte'
	import PinButton from '#lib/components/PinButton.svelte'
	import {actorName, appScreenPath, lexiconPath} from '#lib/paths'

	let {data} = $props()

	/** Starts on the app on this device (the first local profile, else a new one) */
	async function tryLocally(type: string) {
		const profile = await startOnDevice(m.local_default_name())
		await goto(appScreenPath(actorName(localIdentity(profile)), info.domain, {type, create: true}))
	}
	let info = $derived(data.info)
	let me = $derived(auth.me)
	/** This app as your repo has it, when you have records in it */
	let yours = $derived(
		me
			? listCollections(me)
					.then((all) => repoApps(me, all))
					.then((apps) => apps.find((app) => app.namespace === info.namespace))
					.catch(() => undefined)
			: Promise.resolve(undefined)
	)
	const typesOf = (app: RepoApp) => [
		...(app.profile ? [app.profile] : []),
		...app.lists,
		...app.singles
	]
</script>

<enform-page>
	<enform-app-hero>
		<AppIcon domain={info.domain} name={info.name} />
		<hgroup>
			<h1>{info.name}</h1>
			{#if info.name.toLowerCase() !== info.domain}<p>{info.domain}</p>{/if}
		</hgroup>
		<menu>
			<li><PinButton domain={info.domain} name={info.name} /></li>
			{#if info.url}
				<li>
					<a href={info.url} rel="noopener external" target="_blank" role="button"
						>{m.apps_visit({domain: info.domain})} ↗</a
					>
				</li>
			{/if}
		</menu>
		{#if info.description}<p>{info.description}</p>{/if}
	</enform-app-hero>

	{#await yours then app}
		{#if app && me}
			{@const actor = actorName(me)}
			{@const had = byDirectory(typesOf(app).filter((type) => type.used))}
			<section aria-labelledby="yours">
				<h2 id="yours">{m.apps_your_place()}</h2>
				<!-- One card: who you are there, what you have, and one way in -->
				<enform-app-yours>
					<AppProfile repo={me} {app} />
					{#if had.length}
						<p>
							{had.map((type) => typeLabel(type.nsid)).join(' · ')}
						</p>
					{/if}
					<a href={appScreenPath(actor, info.domain)} role="button"
						>{m.apps_open_yours({app: info.name})}</a
					>
				</enform-app-yours>
			</section>
		{/if}
	{/await}

	{#await Promise.all([data.app, yours])}
		<p>{m.collection_loading()}</p>
	{:then [app, mine]}
		{@const start = startType(app)}
		<section aria-labelledby="types">
			{#if app.published}
				<!-- Your app's types when you have it: what you have one of is edited, not made -->
				<AppActions
					types={byDirectory(typesOf(mine ?? app).filter((type) => type.lexicon))}
					href={me
						? (type) => appScreenPath(actorName(me), info.domain, {type, create: true})
						: (type) => lexiconPath(type)}
					edit={me && mine
						? (type, rkey) =>
								appScreenPath(actorName(me), info.domain, {type, record: rkey, edit: true})
						: undefined}
					title={m.apps_types()}
				/>
			{:else}
				<!-- Known by name only: its types (the directory's, and those seen in your repo),
				     and why there is no form for them -->
				{@const known = [
					...new Set([
						...directoryTypes(info.namespace),
						...typesOf(mine ?? app).map((type) => type.nsid)
					])
				]}
				{#if known.length}
					<h2 id="types">{m.apps_types_known()}</h2>
					<enform-type-rows unpublished>
						<ul>
							{#each known as nsid (nsid)}
								<li><span><span>{typeLabel(nsid)}</span><small>{nsid}</small></span></li>
							{/each}
						</ul>
					</enform-type-rows>
				{/if}
				<p><small>{m.apps_unpublished_long({app: info.name})}</small></p>
			{/if}
		</section>

		<!-- Not on it yet: how to start (once you are, you on it comes first, above) -->
		{#if !mine}
			<section aria-labelledby="start">
				<h2 id="start">{auth.me ? m.apps_your_place() : m.start_title()}</h2>
				{#if start && isExample(start) && !auth.local}
					<!-- An example app's records stay on this device: signed in or not -->
					<p>{m.example_on_device()}</p>
					<p>
						<button type="button" onclick={() => tryLocally(start)}>
							{m.start_device_button()}
						</button>
					</p>
				{:else if !auth.me}
					{#if auth.ready}
						{#if start}
							<StartChoice start={() => tryLocally(start)} />
						{:else}
							<p>{m.apps_sign_in({app: info.name})}</p>
							<SignIn />
						{/if}
					{/if}
				{:else if me && start}
					<p>{m.apps_not_yet({app: info.name})}</p>
					<p>
						<a
							href={appScreenPath(actorName(me), info.domain, {type: start, create: true})}
							role="button"
						>
							{m.apps_start({type: typeLabel(start)})}
						</a>
					</p>
				{:else if me}
					<p>{m.apps_not_yet_elsewhere({app: info.name, domain: info.domain})}</p>
				{/if}
			</section>
		{/if}
	{/await}
</enform-page>
