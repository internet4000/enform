<script lang="ts">
	// What one can do in an app, from its types' lexicons alone: one card per type, a
	// verb for its kind (write, share a link, follow…), its name and its own description
	import * as m from '#lib/paraglide/messages.js'
	import {typeLabel} from '#lib/apps/directory'
	import type {AppType} from '#lib/apps/types'
	import {kindOf, type RecordKind} from '#lib/records/kinds'
	import Icon from '../shell/Icon.svelte'

	type Props = {types: AppType[]; href?: (type: string) => string; title: string}
	let {types, href, title}: Props = $props()

	const verbs: Record<RecordKind, () => string> = {
		profile: m.kind_profile,
		post: m.kind_post,
		link: m.kind_link,
		photo: m.kind_photo,
		follow: m.kind_follow,
		reaction: m.kind_reaction,
		status: m.kind_status,
		event: m.kind_event,
		list: m.kind_list,
		thing: m.kind_thing
	}
</script>

{#if types.length}
	<section aria-label={title}>
		<h2>{title}</h2>
		<enform-actions>
			{#each types as type (type.nsid)}
				{@const kind = kindOf(type.lexicon).kind}
				{@const description = type.lexicon?.defs.main?.description ?? type.lexicon?.description}
				<enform-action {kind}>
					<svelte:element this={href ? 'a' : 'div'} href={href?.(type.nsid)}>
						<Icon name={kind} />
						<strong>{verbs[kind]()}</strong>
						<span>{typeLabel(type.nsid)}</span>
						{#if description}<small>{description}</small>{/if}
					</svelte:element>
				</enform-action>
			{/each}
		</enform-actions>
	</section>
{/if}
