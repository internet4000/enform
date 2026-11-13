<script lang="ts">
	// What to create, and as whom. Who you act as first, in a line (with nobody yet, how
	// to start is asked once a type is chosen), then one field to find a type by its name, its app or its NSID (any NSID opens its form),
	// then each app's types as its own screen shows them: the verb of the type's kind, its
	// name and its description. Your apps first; what you have one of is edited, not made.
	import {goto} from '$app/navigation'
	import {NSID} from '@atproto/syntax'
	import * as m from '#lib/paraglide/messages.js'
	import {auth} from '#lib/auth/session.svelte'
	import {listCollections} from '#lib/atproto/repo'
	import {repoApps} from '#lib/apps/apps'
	import {appInfo, byDirectory, typeLabel} from '#lib/apps/directory'
	import type {AppType, RepoApp} from '#lib/apps/types'
	import AppActions from '#lib/components/app/AppActions.svelte'
	import {actorName, appScreenPath, newPath, repoPath} from '#lib/paths'

	let {data} = $props()

	let query = $state('')
	let invalid = $state(false)
	let me = $derived(auth.me)
	let mine = $derived(
		me ? listCollections(me).then((c) => repoApps(me, c)) : Promise.resolve<RepoApp[]>([])
	)
	let words = $derived(query.trim().toLocaleLowerCase().split(/\s+/).filter(Boolean))
	/** What was typed, when it names a type by its NSID */
	let typed = $derived(NSID.isValid(query.trim()) ? query.trim() : undefined)

	/** An app's types to create: its profile, lists, then one-record types */
	const creatable = (app: RepoApp): AppType[] =>
		byDirectory([...(app.profile ? [app.profile] : []), ...app.lists, ...app.singles]).filter(
			(type) => type.lexicon
		)

	/** Its types matching every word typed, in its name, NSID, app or description */
	function matching(app: RepoApp): AppType[] {
		const name = appInfo(app.namespace).name
		return creatable(app).filter((type) => {
			const text = [
				typeLabel(type.nsid),
				type.nsid,
				name,
				app.app,
				type.lexicon?.defs.main?.description ?? ''
			]
				.join(' ')
				.toLocaleLowerCase()
			return words.every((word) => text.includes(word))
		})
	}

	function shown(apps: RepoApp[]) {
		return apps
			.map((app) => ({app, info: appInfo(app.namespace), types: matching(app)}))
			.filter(({types}) => types.length)
	}

	function open(event: SubmitEvent) {
		event.preventDefault()
		invalid = !typed
		if (typed) goto(newPath(typed))
	}

	const edit = (domain: string) =>
		me
			? (type: string, rkey: string) =>
					appScreenPath(actorName(me), domain, {type, record: rkey, edit: true})
			: undefined
</script>

<enform-page>
	<h1>{m.new_title()}</h1>

	{#if me}
		<p>
			{m.new_as()}
			<a href={repoPath(actorName(me))}>@{actorName(me)}</a>
			<small>· {me.local ? m.accounts_on_device() : me.pds ? new URL(me.pds).host : ''}</small>
		</p>
	{:else if auth.ready}
		<p>{m.new_nobody()}</p>
	{/if}

	<form role="search" onsubmit={open}>
		<label>
			{m.new_find_label()}
			<input
				type="search"
				bind:value={query}
				oninput={() => (invalid = false)}
				placeholder={m.new_find_placeholder()}
				autocapitalize="off"
				autocomplete="off"
				spellcheck="false"
				enterkeyhint="go"
				aria-invalid={invalid}
			/>
		</label>
		{#if invalid}<p role="alert">{m.new_nsid_invalid()}</p>{/if}
	</form>

	{#if typed}
		<p><a href={newPath(typed)} role="button">{m.new_record_title({collection: typed})}</a></p>
	{/if}

	<enform-apps>
		{#await mine then yours}
			{@const own = shown(yours)}
			{#each own as { app, info, types } (app.namespace)}
				<AppActions
					{types}
					title={info.name}
					domain={info.domain}
					href={newPath}
					edit={edit(info.domain)}
					limit={words.length ? Infinity : 4}
				/>
			{/each}
			{#await data.known then known}
				{@const others = shown(known.filter((app) => !yours.some((y) => y.app === app.app)))}
				{#if others.length}
					{#if own.length}<h2>{m.new_known()}</h2>{/if}
					{#each others as { app, info, types } (app.namespace)}
						<AppActions
							{types}
							title={info.name}
							domain={info.domain}
							href={newPath}
							limit={words.length ? Infinity : 4}
						/>
					{/each}
				{/if}
				{#if words.length && !own.length && !others.length && !typed}
					<p>{m.new_none({query: query.trim()})}</p>
				{/if}
			{/await}
		{/await}
	</enform-apps>
</enform-page>
