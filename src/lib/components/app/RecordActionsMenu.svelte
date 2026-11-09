<script lang="ts">
	// A record's actions, from what it holds and what it is (records/actions): play, view,
	// map or read it in the reader, with its list; go to the account or the record it
	// points at. On a card, the first one alone; in a record, all of them.
	import * as m from '#lib/paraglide/messages.js'
	import type {LexiconDoc} from '#lib/lexicons/types'
	import {fieldLabel} from '#lib/forms/labels'
	import {atUriPath, repoPath} from '#lib/paths'
	import {inReader, recordActions, type RecordAction} from '#lib/records/actions'

	type Props = {
		value: Record<string, unknown>
		lexicon?: LexiconDoc
		/** What the record is called, for the actions' names */
		title: string
		/** Starts the reader on this record */
		start: () => void
		/** Only the most telling action */
		first?: boolean
	}
	let {value, lexicon, title, start, first = false}: Props = $props()

	let actions = $derived(recordActions(value, lexicon).slice(0, first ? 1 : undefined))

	const words: Record<'play' | 'view' | 'map' | 'read', () => string> = {
		play: m.action_play,
		view: m.action_view,
		map: m.action_map,
		read: m.action_read
	}
	const label = (action: RecordAction) =>
		action.verb === 'account'
			? m.action_account()
			: action.verb === 'record'
				? m.action_record({field: fieldLabel(action.field)})
				: words[action.verb]()
	const href = (action: RecordAction) =>
		action.verb === 'account'
			? repoPath(action.did)
			: action.verb === 'record'
				? atUriPath(action.uri)
				: undefined
</script>

{#if actions.length}
	<enform-record-actions>
		<menu>
			{#each actions as action, index (index)}
				<li>
					{#if inReader(action)}
						<button
							type="button"
							data-verb={action.verb}
							onclick={start}
							aria-label={first ? `${label(action)} · ${title}` : undefined}
						>
							{label(action)}
						</button>
					{:else}
						<a
							href={href(action)}
							role="button"
							aria-label={first ? `${label(action)} · ${title}` : undefined}>{label(action)}</a
						>
					{/if}
				</li>
			{/each}
		</menu>
	</enform-record-actions>
{/if}
