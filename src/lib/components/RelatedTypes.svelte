<script lang="ts">
	// Other apps' types this record also fits, each with a preview of the record a copy
	// would make. If that record exists already (in this repo, or in yours) it is linked
	// instead; else copying opens that type's form in your repo, prefilled, to review.
	import {goto} from '$app/navigation'
	import * as m from '#lib/paraglide/messages.js'
	import {auth} from '#lib/auth/session.svelte'
	import type {Identity} from '#lib/atproto/identity'
	import {knownApps} from '#lib/apps/apps'
	import {appInfo, typeLabel} from '#lib/apps/directory'
	import {findSame} from '#lib/apps/existing'
	import {carried, relatedTypes} from '#lib/apps/related'
	import type {LexiconDoc} from '#lib/lexicons/types'
	import {recordCard} from '#lib/records/card'
	import {actorName, atUriPath, createPath} from '#lib/paths'
	import AppIcon from './pane/AppIcon.svelte'

	type Props = {repo: Identity; nsid: string; lexicon?: LexiconDoc; value: Record<string, unknown>}
	let {repo, nsid, lexicon, value}: Props = $props()

	let related = $derived(knownApps().then((apps) => relatedTypes(nsid, lexicon, value, apps)))
	let me = $derived(auth.identity && auth.identity.did !== repo.did ? auth.identity : undefined)

	function copy(target: string, prefill: Record<string, unknown>) {
		if (!auth.identity) return
		goto(createPath(actorName(auth.identity), target), {state: {prefill}})
	}
</script>

{#await related then list}
	{#if list.length}
		<section aria-labelledby="related">
			<h2 id="related">{m.related_title()}</h2>
			{#each list as { app, type, fields } (type.nsid)}
				{@const info = appInfo(app.namespace)}
				{@const prefill = carried(value, fields)}
				{@const card = recordCard(prefill, type.lexicon?.defs.main?.record)}
				{@const label = typeLabel(type.nsid)}
				<enform-related>
					<header>
						<AppIcon domain={info.domain} name={info.name} />
						<strong>{info.name} · {label}</strong>
					</header>
					<p><small>{m.related_reason({fields: fields.join(', ')})}</small></p>
					<blockquote>
						<strong>{card.title ?? label}</strong>
						{#if card.text}<p>{card.text}</p>{/if}
					</blockquote>
					{#await findSame(repo, type.nsid, prefill) then here}
						{#if here}
							<p>
								<a href={atUriPath(here.uri)}>
									{m.related_exists({actor: actorName(repo), app: info.name, type: label})}
								</a>
							</p>
						{:else if me}
							{#await findSame(me, type.nsid, prefill) then mine}
								{#if mine}
									<p><a href={atUriPath(mine.uri)}>{m.related_exists_yours({type: label})}</a></p>
								{:else}
									<button type="button" onclick={() => copy(type.nsid, prefill)}>
										{m.related_copy({app: info.name})}
									</button>
								{/if}
							{/await}
						{:else if auth.session && auth.identity?.did === repo.did}
							<button type="button" onclick={() => copy(type.nsid, prefill)}>
								{m.related_copy({app: info.name})}
							</button>
						{/if}
					{/await}
				</enform-related>
			{/each}
		</section>
	{/if}
{/await}
