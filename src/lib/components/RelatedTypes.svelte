<script lang="ts">
	// Other apps' types this record also fits, each as a preview of the record a copy
	// would make; copying opens that type's form in your repo, prefilled, to review
	import {goto} from '$app/navigation'
	import * as m from '#lib/paraglide/messages.js'
	import {auth} from '#lib/auth/session.svelte'
	import {knownApps} from '#lib/apps/apps'
	import {appInfo, typeLabel} from '#lib/apps/directory'
	import {carried, relatedTypes} from '#lib/apps/related'
	import type {LexiconDoc} from '#lib/lexicons/types'
	import {recordCard} from '#lib/records/card'
	import {actorName, createPath} from '#lib/paths'
	import AppIcon from './pane/AppIcon.svelte'

	type Props = {nsid: string; lexicon?: LexiconDoc; value: Record<string, unknown>}
	let {nsid, lexicon, value}: Props = $props()

	let related = $derived(knownApps().then((apps) => relatedTypes(nsid, lexicon, value, apps)))

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
				<enform-related>
					<header>
						<AppIcon domain={info.domain} name={info.name} />
						<strong>{info.name} · {typeLabel(type.nsid)}</strong>
					</header>
					<p><small>{m.related_reason({fields: fields.join(', ')})}</small></p>
					<blockquote>
						<strong>{card.title ?? typeLabel(type.nsid)}</strong>
						{#if card.text}<p>{card.text}</p>{/if}
					</blockquote>
					{#if auth.identity}
						<button type="button" onclick={() => copy(type.nsid, prefill)}>
							{m.related_copy({app: info.name})}
						</button>
					{/if}
				</enform-related>
			{/each}
		</section>
	{/if}
{/await}
