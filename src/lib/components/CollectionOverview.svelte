<script lang="ts">
	// What a collection is, beside its records: its app, what its type holds (from its
	// lexicon), and, for its owner, adding to it
	import * as m from '#lib/paraglide/messages.js'
	import {auth} from '#lib/auth/session.svelte'
	import type {Identity} from '#lib/atproto/identity'
	import {appInfo} from '#lib/apps/directory'
	import {namespaceOf} from '#lib/apps/names'
	import type {LexiconDoc} from '#lib/lexicons/types'
	import {actorName, createPath, lexiconPath} from '#lib/paths'
	import AppIcon from './pane/AppIcon.svelte'

	type Props = {repo: Identity; collection: string; lexicon: Promise<LexiconDoc | undefined>}
	let {repo, collection, lexicon}: Props = $props()

	let app = $derived(appInfo(namespaceOf(collection)))
	let owner = $derived(auth.owns(repo))
</script>

<enform-overview>
	<header>
		<AppIcon domain={app.domain} name={app.name} />
		<span>{m.overview_app({app: app.name})}</span>
	</header>
	{#await lexicon then doc}
		{@const description = doc?.description ?? doc?.defs.main?.description}
		{#if description}<p>{description}</p>{/if}
		{#if !doc}<p>{m.overview_unpublished()}</p>{/if}
		<menu>
			{#if owner && doc}
				<li>
					<a href={createPath(actorName(repo), collection)} role="button">{m.collection_add()}</a>
				</li>
			{/if}
			{#if doc}<li><a href={lexiconPath(collection)}>{m.lexicon_view()}</a></li>{/if}
		</menu>
	{/await}
	<p><small>{m.overview_pick()}</small></p>
</enform-overview>
