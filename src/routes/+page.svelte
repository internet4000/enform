<script lang="ts">
	import * as m from '#lib/paraglide/messages.js'
	import {auth} from '#lib/auth/session.svelte'
	import ActorSearch from '#lib/components/ActorSearch.svelte'
	import app from '#lib/config/app.json' with {type: 'json'}
	import {actorName, repoPath} from '#lib/paths'
</script>

<enform-home>
	<h1>{m.app_tagline()}</h1>
	<p>{m.app_intro()}</p>
	<ActorSearch />
	<p>{m.home_examples()}</p>
	<ul>
		{#if auth.identity}
			<li><a href={repoPath(actorName(auth.identity))}>{m.home_mine()}</a></li>
		{/if}
		{#each app.examples as example (example)}
			<li><a href={repoPath(example)}>@{example}</a></li>
		{/each}
	</ul>
</enform-home>
