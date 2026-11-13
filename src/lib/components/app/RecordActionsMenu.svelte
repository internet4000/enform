<script lang="ts">
	// A record's actions, from what it holds and what it is (records/actions): play, view,
	// map or read it in the reader, with its list; go to the account or the record it
	// points at, named (@alice.test →, Event →)
	import type {LexiconDoc} from '#lib/lexicons/types'
	import {atUriAppPath, repoPath} from '#lib/paths'
	import {inReader, recordActions, type RecordAction} from '#lib/records/actions'
	import ActionName from './ActionName.svelte'

	type Props = {
		value: Record<string, unknown>
		lexicon?: LexiconDoc
		/** What the record is called */
		title: string
		/** Starts the reader on this record */
		start: () => void
	}
	let {value, lexicon, start}: Props = $props()

	let actions = $derived(recordActions(value, lexicon))

	const href = (action: RecordAction) =>
		action.verb === 'account'
			? repoPath(action.did)
			: action.verb === 'record'
				? atUriAppPath(action.uri)
				: undefined
</script>

{#if actions.length}
	<enform-record-actions>
		<menu>
			{#each actions as action, index (index)}
				<li>
					{#if inReader(action)}
						<button type="button" data-verb={action.verb} onclick={start}>
							<ActionName {action} />
						</button>
					{:else}
						<a href={href(action)} role="button"><ActionName {action} /></a>
					{/if}
				</li>
			{/each}
		</menu>
	</enform-record-actions>
{/if}
