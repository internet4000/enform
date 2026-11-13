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
	import {actorName, createPath, lexiconPath, recordPath} from '#lib/paths'

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
		if (here) return {repo, record: here}
		if (!auth.me || auth.owns(repo)) return undefined
		const me = auth.me
		const mine = await findSame(me, target, prefill)
		return mine ? {repo: me, record: mine} : undefined
	}

	function copyTo(target: string, prefill: Record<string, unknown>) {
		if (!auth.me) return
		menu?.hidePopover()
		goto(createPath(actorName(auth.me), target), {state: {prefill}})
	}

	async function copyLink() {
		await navigator.clipboard.writeText(uri)
		copied = true
		setTimeout(() => (copied = false), 1500)
	}
</script>

<li>
	<button
		type="button"
		popovertarget="{id}-menu"
		style:anchor-name="--{id}-menu"
		aria-label={m.record_menu()}>⋯</button
	>
	<enform-menu id="{id}-menu" popover="auto" style:position-anchor="--{id}-menu" bind:this={menu}>
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
								<a
									href={recordPath(
										actorName(found.repo),
										found.record.collection,
										found.record.rkey
									)}>{m.related_exists_short({type: label})}</a
								>
							{:else if auth.me}
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
			{#if uri}
				<li>
					<button type="button" onclick={copyLink}>
						{copied ? m.record_link_copied() : m.record_copy_link()}
					</button>
				</li>
			{/if}
		</ul>
	</enform-menu>
</li>
