<script lang="ts">
	// What to create: a type of one of your apps, of an app enform knows, or any NSID
	import {goto} from '$app/navigation'
	import {NSID} from '@atproto/syntax'
	import * as m from '#lib/paraglide/messages.js'
	import {auth} from '#lib/auth/session.svelte'
	import {listCollections} from '#lib/atproto/repo'
	import {repoApps} from '#lib/apps/apps'
	import type {AppType, RepoApp} from '#lib/apps/types'
	import {isDeclared} from '#lib/auth/scopes'
	import TypeRows from '#lib/components/TypeRows.svelte'
	import {newPath} from '#lib/paths'

	let {data} = $props()

	let nsid = $state('')
	let invalid = $state(false)
	let mine = $derived(
		auth.me ? listCollections(auth.me).then((c) => repoApps(auth.me!, c)) : Promise.resolve([])
	)

	function open(event: SubmitEvent) {
		event.preventDefault()
		const value = nsid.trim()
		invalid = !NSID.isValid(value)
		if (!invalid) goto(newPath(value))
	}

	/** An app's types to create: its profile, lists, then one-record types */
	const creatable = (app: RepoApp) => [
		...(app.profile ? [app.profile] : []),
		...app.lists.filter((type) => type.lexicon),
		...app.singles.filter((type) => type.lexicon)
	]

	/** The types to show first: the ones you use, and the ones enform knows well */
	const main = (type: AppType) => type.used || isDeclared(type.nsid)
</script>

<enform-page>
	<h1>{m.new_title()}</h1>

	{#snippet apps(list: RepoApp[])}
		{#each list.filter((app) => creatable(app).length) as app (app.app)}
			{@const types = creatable(app)}
			{@const first = types.filter(main)}
			{@const rest = types.filter((type) => !main(type))}
			<section>
				<h3>{app.app}</h3>
				<TypeRows types={first.length ? first : types} create />
				{#if first.length && rest.length}
					<details>
						<summary>{m.new_more({app: app.app, count: String(rest.length)})}</summary>
						<TypeRows types={rest} create />
					</details>
				{/if}
			</section>
		{/each}
	{/snippet}

	<enform-apps>
		{#await mine then list}
			{#if list.length}
				<h2>{m.new_yours()}</h2>
				{@render apps(list)}
			{/if}
			{#await data.known then known}
				{@const others = known.filter((app) => !list.some((mine) => mine.app === app.app))}
				{#if others.length}
					<h2>{m.new_known()}</h2>
					{@render apps(others)}
				{/if}
			{/await}
		{/await}
	</enform-apps>

	<details>
		<summary>{m.new_other()}</summary>
		<form onsubmit={open}>
			<label>
				{m.new_nsid_label()}
				<input
					type="text"
					bind:value={nsid}
					placeholder="com.example.recipe"
					autocapitalize="off"
					autocomplete="off"
					spellcheck="false"
					enterkeyhint="go"
					aria-invalid={invalid}
					required
				/>
			</label>
			<button type="submit">{m.new_nsid_submit()}</button>
		</form>
		{#if invalid}<p role="alert">{m.new_nsid_invalid()}</p>{/if}
	</details>
</enform-page>
