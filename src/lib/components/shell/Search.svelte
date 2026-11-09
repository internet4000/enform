<script lang="ts">
	// The search field, at the top of every screen. Where there is something to search in
	// place (an app's records, someone's apps, the apps to explore), it searches there as
	// one types, said in a chip one can remove; anywhere else, or once removed, everywhere:
	// someone's handle, an app, a lexicon. An at:// URI or a DID opens at once.
	import {goto} from '$app/navigation'
	import {page} from '$app/state'
	import * as m from '#lib/paraglide/messages.js'
	import {shownUrl} from '#lib/where.svelte'
	import type {Identity} from '#lib/atproto/identity'
	import {appInfo, typeLabel} from '#lib/apps/directory'
	import type {RepoApp} from '#lib/apps/types'
	import {actorName, searchPath, searchResultsPath} from '#lib/paths'

	let query = $derived(shownUrl().searchParams.get('q') ?? '')
	let input = $derived(query)
	/** The page where the chip was removed: searching everywhere from it */
	let everywhereAt = $state<string>()

	/** What this page lets one search in place, from its route */
	let scope = $derived.by(() => {
		if (everywhereAt === shownUrl().pathname) return undefined
		const data = page.data as {repo?: Identity; app?: RepoApp}
		const id = page.route.id
		if (id === '/[actor=actor]/apps/[app]' && data.repo && data.app) {
			const type = shownUrl().searchParams.get('type')
			const what = type ? typeLabel(type) : appInfo(data.app.namespace).name
			return `${what} · @${actorName(data.repo)}`
		}
		if (id === '/[actor=actor]' && data.repo)
			return m.search_scope_person({
				actor: `@${actorName(data.repo)}`
			})
		if (id === '/explore') return m.search_scope_apps()
		return undefined
	})

	/** In place: the page's URL says what is searched, as one types */
	function narrow(value: string): Promise<void> {
		const url = new URL(shownUrl().href)
		if (value.trim()) url.searchParams.set('q', value)
		else url.searchParams.delete('q')
		return goto(url, {shallow: true, replace: true, state: page.state})
	}

	function oninput() {
		if (scope) narrow(input)
	}

	function submit(event: SubmitEvent) {
		event.preventDefault()
		const value = input.trim()
		const field = (event.currentTarget as HTMLFormElement).elements.namedItem('q')
		if (scope) return (field as HTMLInputElement | null)?.blur()
		if (!value) return
		const direct = /^(at:\/\/|did:)/.test(value) ? searchPath(value) : undefined
		goto(direct ?? searchResultsPath(value))
	}

	/** Searching everywhere instead: the page shows all again, the text stays to search */
	async function everywhere(event: MouseEvent) {
		const kept = input
		const form = (event.currentTarget as HTMLElement).closest('form')
		if (query) await narrow('')
		everywhereAt = shownUrl().pathname
		input = kept
		;(form?.elements.namedItem('q') as HTMLInputElement | null)?.focus()
	}
</script>

<form role="search" onsubmit={submit}>
	{#if scope}
		<button type="button" onclick={everywhere} aria-label={m.search_everywhere({scope})}>
			<span>{scope}</span> <span aria-hidden="true">×</span>
		</button>
	{/if}
	<input
		type="search"
		name="q"
		bind:value={input}
		{oninput}
		aria-label={scope ? `${m.search_label()} · ${scope}` : m.search_label()}
		placeholder={scope ? m.search_here() : m.search_placeholder()}
		autocapitalize="off"
		autocomplete="off"
		spellcheck="false"
		enterkeyhint="search"
	/>
</form>
