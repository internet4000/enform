<script lang="ts">
	// Someone a record names, by their DID: their avatar and name, once it comes into view
	import {resolvePerson} from '#lib/records/links'
	import {actorName, repoPath} from '#lib/paths'
	import {whenVisible} from './visible'

	type Props = {
		/** A DID (or handle) */
		actor: string
		size?: 'small'
	}

	let {actor, size}: Props = $props()
	let visible = $state(false)
</script>

{#snippet plain()}
	<a href={repoPath(actor)}>{actor}</a>
{/snippet}

{#if !visible}
	<enform-identity-chip state="loading" {size} {@attach whenVisible(() => (visible = true))}>
		{@render plain()}
	</enform-identity-chip>
{:else}
	{#await resolvePerson(actor)}
		<enform-identity-chip state="loading" {size}>{@render plain()}</enform-identity-chip>
	{:then person}
		{@const {did, handle} = person.identity}
		<enform-identity-chip state="ready" {size} named={person.name ? true : undefined}>
			<a href={repoPath(actorName(person.identity))} title={did}>
				<enform-avatar>
					{#if person.avatar}
						<img src={person.avatar} alt="" loading="lazy" />
					{:else}
						{(person.name ?? handle ?? did.replace(/^did:\w+:/, '')).charAt(0).toUpperCase()}
					{/if}
				</enform-avatar>
				{#if person.name}<strong>{person.name}</strong>{/if}
				<small>{handle ? `@${handle}` : did}</small>
			</a>
		</enform-identity-chip>
	{:catch}
		<enform-identity-chip state="unavailable" {size}>{@render plain()}</enform-identity-chip>
	{/await}
{/if}
