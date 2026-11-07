<script lang="ts">
	// A profile record (one per account) as a card, linking to the record itself
	import type {Identity} from '#lib/atproto/identity'
	import {blobUrl} from '#lib/atproto/repo'
	import type {AppProfile} from '#lib/apps'
	import {recordCard} from '#lib/records/card'
	import * as m from '#lib/paraglide/messages.js'
	import {editPath, recordPath} from '#lib/paths'

	type Props = {repo: Identity; actor: string; profile: AppProfile; owner?: boolean}
	let {repo, actor, profile, owner = false}: Props = $props()

	let card = $derived(recordCard(profile.record.value, profile.lexicon?.defs.main?.record))
</script>

<enform-profile banner={!!card.banner || undefined}>
	<a href={recordPath(actor, profile.nsid, profile.rkey)}>
		{#if card.banner}<img src={blobUrl(repo, card.banner)} alt="" loading="lazy" />{/if}
		<figure>
			{#if card.avatar}<img src={blobUrl(repo, card.avatar)} alt="" loading="lazy" />{/if}
			<figcaption>
				<strong>{card.title ?? profile.nsid}</strong>
				{#if card.text}<p>{card.text}</p>{/if}
				<small>{profile.nsid}</small>
			</figcaption>
		</figure>
	</a>
	{#if owner && profile.lexicon}
		<p>
			<a href={editPath(actor, profile.nsid, profile.rkey)} role="button">
				{m.profile_edit()}
			</a>
		</p>
	{/if}
</enform-profile>
