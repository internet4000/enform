<script lang="ts">
	// What to do with a record of the reader's list: open it, edit it (yours), share it,
	// copy its at:// link, or take it out of the list
	import * as m from '#lib/paraglide/messages.js'
	import {auth} from '#lib/auth/session.svelte'
	import {reader, type ReaderItem} from '#lib/reader/reader.svelte'
	import {actorName, editPath} from '#lib/paths'

	let {entry, index, title}: {entry: ReaderItem; index: number; title: string} = $props()

	const id = $props.id()
	let menu = $state<HTMLElement>()
	let copied = $state<'share' | 'uri'>()
	let mine = $derived(auth.owns(entry.repo))

	/** Leaving full screen to see the page it opens */
	function leave() {
		menu?.hidePopover()
		if (reader.mode === 'full') reader.mode = 'docked'
	}

	async function copy(text: string, what: 'share' | 'uri') {
		await navigator.clipboard.writeText(text)
		copied = what
		setTimeout(() => (copied = undefined), 1500)
	}

	/** The system's share sheet where there is one, else its link copied */
	async function share() {
		const url = new URL(entry.href, location.href).href
		if (navigator.share) {
			await navigator.share({title, url}).catch(() => {})
			menu?.hidePopover()
		} else {
			await copy(url, 'share')
		}
	}
</script>

<button
	type="button"
	popovertarget="{id}-item"
	style:anchor-name="--{id}-item"
	aria-label={m.reader_item_menu({title})}
	title={m.record_menu()}>⋯</button
>
<enform-menu id="{id}-item" popover="auto" style:position-anchor="--{id}-item" bind:this={menu}>
	<ul>
		<li><span>{title}</span></li>
		<li><a href={entry.href} onclick={leave}>{m.reader_open()}</a></li>
		{#if mine}
			<li>
				<a
					href={editPath(actorName(entry.repo), entry.record.collection, entry.record.rkey)}
					onclick={leave}>{m.record_edit()}</a
				>
			</li>
		{/if}
		<li>
			<button type="button" onclick={share}>
				{copied === 'share' ? m.record_shared() : m.record_share()}
			</button>
		</li>
		{#if entry.record.uri}
			<li>
				<button type="button" onclick={() => copy(entry.record.uri, 'uri')}>
					{copied === 'uri' ? m.record_link_copied() : m.record_copy_link()}
				</button>
			</li>
		{/if}
		<li>
			<button
				type="button"
				onclick={() => {
					menu?.hidePopover()
					reader.remove(index)
				}}>{m.reader_remove()}</button
			>
		</li>
	</ul>
</enform-menu>
