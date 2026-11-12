<script lang="ts">
	// Settings' top, as Bluesky's: who you act as, once and large (picture, name, handle,
	// and where their records are kept), opening your page. With nobody yet, the two ways
	// to start.
	import * as m from '#lib/paraglide/messages.js'
	import {auth} from '#lib/auth/session.svelte'
	import {resolvePerson, type Person} from '#lib/records/links'
	import {startOnDevice} from '#lib/local/start'
	import {actorName, repoPath} from '#lib/paths'
	import StartChoice from './StartChoice.svelte'

	let me = $derived(auth.me)
	let person = $derived<Promise<Person | undefined>>(
		me && !me.local ? resolvePerson(me.did).catch(() => undefined) : Promise.resolve(undefined)
	)
	let where = $derived(
		me?.local ? m.accounts_on_device() : me?.pds ? new URL(me.pds).host : undefined
	)
</script>

{#snippet card(actor: string, found: Person | undefined)}
	{@const name = auth.local?.name ?? found?.name}
	<a href={repoPath(actor)}>
		<enform-avatar>
			{#if found?.avatar}
				<img src={found.avatar} alt="" />
			{:else}
				{(name ?? actor).charAt(0).toUpperCase()}
			{/if}
		</enform-avatar>
		<strong>{name ?? `@${actor}`}</strong>
		<small>{[name && `@${actor}`, where].filter(Boolean).join(' · ')}</small>
	</a>
{/snippet}

<enform-settings-you>
	{#if me}
		{@const actor = actorName(me)}
		{#await person}
			{@render card(actor, undefined)}
		{:then found}
			{@render card(actor, found)}
		{/await}
	{:else if auth.ready}
		<p>{m.you_nobody()}</p>
		<StartChoice start={() => startOnDevice(m.local_default_name()).then(() => {})} />
	{/if}
</enform-settings-you>
