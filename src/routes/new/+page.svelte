<script lang="ts">
	// What to create, and as whom. Who you act as first, in a line (with nobody yet, how
	// to start is asked once a type is chosen), then one field to find a type by its name, its app or its NSID (any NSID opens its form),
	// then every type of each app, a row each: the verb of its kind, its name, its
	// description, its lexicon (by its NSID), and whether your repo has records of it.
	// Your apps first; the types you use and enform knows well first in each, the rest
	// folded; what you have one of is edited, not made again.
	import {goto} from '$app/navigation'
	import {NSID} from '@atproto/syntax'
	import * as m from '#lib/paraglide/messages.js'
	import {auth} from '#lib/auth/session.svelte'
	import {listCollections} from '#lib/atproto/repo'
	import {repoApps} from '#lib/apps/apps'
	import {appInfo, byDirectory, typeLabel, type AppInfo} from '#lib/apps/directory'
	import type {AppSingle, AppType, RepoApp} from '#lib/apps/types'
	import {isDeclared} from '#lib/auth/scopes'
	import {kindOf} from '#lib/records/kinds'
	import {kindVerb} from '#lib/records/kind-words'
	import AppIcon from '#lib/components/pane/AppIcon.svelte'
	import Icon from '#lib/components/shell/Icon.svelte'
	import {actorName, appPath, appScreenPath, lexiconPath, newPath, repoPath} from '#lib/paths'

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

	/** The types to show first: the ones you use, and the ones enform knows well */
	const main = (type: AppType) => type.used || isDeclared(type.nsid)

	/** The one record of this type you already have, to edit rather than make again */
	const had = (type: AppType): string | undefined =>
		'rkey' in type && (type as AppSingle).record ? (type as AppSingle).rkey : undefined

	function target(type: AppType, domain: string, yours: boolean) {
		const rkey = yours && me ? had(type) : undefined
		const label = typeLabel(type.nsid)
		if (rkey && me) {
			return {
				href: appScreenPath(actorName(me), domain, {type: type.nsid, record: rkey, edit: true}),
				verb: m.actions_edit({type: label.toLocaleLowerCase()})
			}
		}
		const words = kindVerb(kindOf(type.lexicon).kind, label)
		return {href: newPath(type.nsid), verb: words.named ? undefined : words.verb}
	}
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

	{#snippet rows(types: AppType[], domain: string, yours: boolean)}
		<ul>
			{#each types as type (type.nsid)}
				{@const kind = kindOf(type.lexicon).kind}
				{@const to = target(type, domain, yours)}
				{@const description = type.lexicon?.defs.main?.description ?? type.lexicon?.description}
				<li>
					<a href={to.href}>
						<Icon name={kind} />
						<span>
							<strong>{typeLabel(type.nsid)}</strong>
							{#if to.verb}<small>{to.verb}</small>{/if}
							{#if yours && type.used}<small>{m.new_used()}</small>{/if}
						</span>
						{#if description}<p>{description}</p>{/if}
					</a>
					<a href={lexiconPath(type.nsid)} title={m.lexicon_view()}><code>{type.nsid}</code></a>
				</li>
			{/each}
		</ul>
	{/snippet}

	{#snippet group(app: RepoApp, info: AppInfo, types: AppType[], yours: boolean)}
		{@const first = words.length ? types : types.filter(main)}
		{@const shownFirst = first.length ? first : types}
		{@const rest = types.filter((type) => !shownFirst.includes(type))}
		<section aria-label={info.name}>
			<h3>
				<AppIcon domain={info.domain} name={info.name} />
				<span>{info.name}</span>
				<a href={appPath(info.domain)}>{info.domain}</a>
			</h3>
			{@render rows(shownFirst, info.domain, yours)}
			{#if rest.length}
				<details>
					<summary>{m.new_more({app: info.name, count: String(rest.length)})}</summary>
					{@render rows(rest, info.domain, yours)}
				</details>
			{/if}
		</section>
	{/snippet}

	<enform-create-types>
		{#await mine then yours}
			{@const own = shown(yours)}
			{#if own.length}
				<h2>{m.new_yours()}</h2>
				{#each own as { app, info, types } (app.namespace)}
					{@render group(app, info, types, true)}
				{/each}
			{/if}
			{#await data.known}
				<p aria-busy="true">{m.new_loading()}</p>
			{:then known}
				{@const others = shown(known.filter((app) => !yours.some((y) => y.app === app.app)))}
				{#if others.length}
					<h2>{own.length ? m.new_known() : m.new_apps()}</h2>
					{#each others as { app, info, types } (app.namespace)}
						{@render group(app, info, types, false)}
					{/each}
				{/if}
				{#if words.length && !own.length && !others.length && !typed}
					<p>{m.new_none({query: query.trim()})}</p>
				{/if}
			{/await}
		{/await}
	</enform-create-types>
</enform-page>
