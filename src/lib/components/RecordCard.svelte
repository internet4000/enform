<script lang="ts">
	// A record another one links to, as a small card read from its own repo, once in view.
	// Its own links are not followed: cards go one level deep.
	import * as m from '#lib/paraglide/messages.js'
	import {appInfo, typeLabel} from '#lib/apps/directory'
	import {namespaceOf} from '#lib/apps/names'
	import {formatDate} from '#lib/dates'
	import {resolveLinkedRecord} from '#lib/records/links'
	import {atUriAppPath} from '#lib/paths'
	import IdentityChip from './IdentityChip.svelte'
	import {whenVisible} from './visible'

	type Props = {
		uri: string
		/** The version a strong ref names */
		cid?: string
	}

	let {uri, cid}: Props = $props()
	let visible = $state(false)
	let href = $derived(atUriAppPath(uri))
</script>

{#snippet version()}
	{#if cid}
		<details>
			<summary>{m.link_version()}</summary>
			<code>{cid}</code>
		</details>
	{/if}
{/snippet}

{#snippet plain()}
	<a {href}>{uri}</a>
	{@render version()}
{/snippet}

{#if !visible}
	<enform-record-card state="loading" {@attach whenVisible(() => (visible = true))}>
		{@render plain()}
	</enform-record-card>
{:else}
	{#await resolveLinkedRecord(uri)}
		<enform-record-card state="loading">{@render plain()}</enform-record-card>
	{:then record}
		{@const type = typeLabel(record.collection)}
		<enform-record-card state="ready" image={record.image ? true : undefined}>
			<header>
				<IdentityChip actor={record.author.did} size="small" />
				<small>
					{m.link_type_in_app({type, app: appInfo(namespaceOf(record.collection)).name})}
				</small>
			</header>
			<a {href}>
				<strong>{record.title ?? type}</strong>
				{#if record.text}<p>{record.text}</p>{/if}
				{#if record.image}<img src={record.image} alt="" loading="lazy" />{/if}
			</a>
			{#if record.date || cid}
				<footer>
					{#if record.date}<time datetime={record.date}>{formatDate(record.date)}</time>{/if}
					{@render version()}
				</footer>
			{/if}
		</enform-record-card>
	{:catch}
		<enform-record-card state="unavailable" title={m.link_unavailable()}>
			{@render plain()}
		</enform-record-card>
	{/await}
{/if}
