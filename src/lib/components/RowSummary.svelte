<script lang="ts">
	// A list row's line: the record's summary, or, when that is only a link (a like's
	// subject, a follow's DID), what it links to, read once the row is in view
	import * as m from '#lib/paraglide/messages.js'
	import {isValidDid} from '@atproto/syntax'
	import {isRecordUri, resolveLinkedRecord, resolvePerson} from '#lib/records/links'
	import {whenVisible} from './visible'

	let {text}: {text: string} = $props()

	let visible = $state(false)
	let linked = $derived.by(() => {
		if (!visible) return undefined
		if (isRecordUri(text)) {
			return resolveLinkedRecord(text).then((record) =>
				m.row_linked_record({
					author: `@${record.author.handle ?? record.author.did}`,
					title: record.title ?? record.text ?? ''
				})
			)
		}
		if (isValidDid(text)) {
			return resolvePerson(text).then(
				(person) => person.name ?? (person.identity.handle ? `@${person.identity.handle}` : text)
			)
		}
		return undefined
	})
</script>

<p {@attach whenVisible(() => (visible = true))}>
	{#await linked}
		{text}
	{:then line}
		{line ?? text}
	{:catch}
		{text}
	{/await}
</p>
