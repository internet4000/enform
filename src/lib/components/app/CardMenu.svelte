<script lang="ts">
	// A card's other ways: the record itself (View record), its actions but the card's
	// own, the types that answer it, its at:// link. Always there, so the record is one
	// tap away whatever a click on the card does.
	import * as m from '#lib/paraglide/messages.js'
	import type {Identity} from '#lib/atproto/identity'
	import type {RepoRecord} from '#lib/atproto/repo'
	import {atUriAppPath, repoPath} from '#lib/paths'
	import {inReader, type RecordAction} from '#lib/records/actions'
	import AnswerActions from '../AnswerActions.svelte'
	import ActionName from './ActionName.svelte'

	type Props = {
		repo: Identity
		record: RepoRecord
		/** The record's own page */
		href: string
		/** Its actions, but the card's own */
		actions: RecordAction[]
		/** Starts the reader on it, with its list */
		play?: () => void
		/** What the record is called, for the menu's name */
		title: string
	}
	let {repo, record, href, actions, play, title}: Props = $props()

	const id = $props.id()
	let menu = $state<HTMLElement>()
	let copied = $state(false)

	const target = (action: RecordAction) =>
		action.verb === 'account'
			? repoPath(action.did)
			: action.verb === 'record'
				? atUriAppPath(action.uri)
				: undefined

	async function copyLink() {
		await navigator.clipboard.writeText(record.uri)
		copied = true
		setTimeout(() => (copied = false), 1500)
	}
</script>

<enform-card-menu>
	<button type="button" popovertarget="{id}-menu" aria-label={`${m.record_menu()} · ${title}`}
		>⋯</button
	>
	<enform-menu id="{id}-menu" popover="auto" bind:this={menu}>
		<ul>
			<li><a {href} onclick={() => menu?.hidePopover()}>{m.action_view_record()}</a></li>
			{#each actions as action, index (index)}
				<li>
					{#if inReader(action)}
						{#if play}
							<button
								type="button"
								onclick={() => {
									menu?.hidePopover()
									play()
								}}><ActionName {action} /></button
							>
						{/if}
					{:else}
						<a href={target(action)}><ActionName {action} /></a>
					{/if}
				</li>
			{/each}
			<AnswerActions {repo} {record} bare />
			{#if record.uri}
				<li>
					<button type="button" onclick={copyLink}>
						{copied ? m.record_link_copied() : m.record_copy_link()}
					</button>
				</li>
			{/if}
		</ul>
	</enform-menu>
</enform-card-menu>
