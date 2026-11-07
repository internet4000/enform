<script lang="ts">
	// A record's occasional actions, in a menu: copy it to another app's type it fits
	// (or open the copy that exists), see its lexicon, copy its at:// link
	import {goto} from '$app/navigation'
	import * as m from '#lib/paraglide/messages.js'
	import {auth} from '#lib/auth/session.svelte'
	import type {Identity} from '#lib/atproto/identity'
	import {knownApps} from '#lib/apps/apps'
	import {appInfo, typeLabel} from '#lib/apps/directory'
	import {findSame} from '#lib/apps/existing'
	import {carried, relatedTypes} from '#lib/apps/related'
	import type {LexiconDoc} from '#lib/lexicons/types'
	import {actorName, atUriPath, createPath, lexiconPath} from '#lib/paths'

	type Props = {
		repo: Identity
		nsid: string
		uri: string
		lexicon?: LexiconDoc
		value: Record<string, unknown>
	}
	let {repo, nsid, uri, lexicon, value}: Props = $props()

	const id = $props.id()
	let menu = $state<HTMLElement>()
	let copied = $state(false)
	let related = $derived(knownApps().then((apps) => relatedTypes(nsid, lexicon, value, apps)))

	/** Where this record's copy to `target` is already: in this repo, else in yours */
	async function existing(target: string, prefill: Record<string, unknown>) {
		const here = await findSame(repo, target, prefill)
		if (here || !auth.identity || auth.identity.did === repo.did) return here
		return findSame(auth.identity, target, prefill)
	}

	function copyTo(target: string, prefill: Record<string, unknown>) {
		if (!auth.identity) return
		menu?.hidePopover()
		goto(createPath(actorName(auth.identity), target), {state: {prefill}})
	}

	async function copyLink() {
		await navigator.clipboard.writeText(uri)
		copied = true
		setTimeout(() => (copied = false), 1500)
	}
</script>

<li>
	<button type="button" popovertarget="{id}-menu" aria-label={m.record_menu()}>⋯</button>
	<enform-menu id="{id}-menu" popover bind:this={menu}>
		<ul>
			{#await related then list}
				{#each list as { app, type, fields } (type.nsid)}
					{@const info = appInfo(app.namespace)}
					{@const prefill = carried(value, fields)}
					{@const label = `${info.name} · ${typeLabel(type.nsid)}`}
					<li>
						{#await existing(type.nsid, prefill)}
							<span>{m.related_copy({app: label})}</span>
						{:then found}
							{#if found}
								<a href={atUriPath(found.uri)}>{m.related_exists_short({type: label})}</a>
							{:else if auth.identity}
								<button type="button" onclick={() => copyTo(type.nsid, prefill)}>
									{m.related_copy({app: label})}
									<small>{m.related_reason({fields: fields.join(', ')})}</small>
								</button>
							{/if}
						{/await}
					</li>
				{/each}
			{/await}
			<li><a href={lexiconPath(nsid)}>{m.lexicon_view()}</a></li>
			<li>
				<button type="button" onclick={copyLink}>
					{copied ? m.record_link_copied() : m.record_copy_link()}
				</button>
			</li>
		</ul>
	</enform-menu>
</li>
