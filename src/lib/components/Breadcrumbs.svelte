<script lang="ts">
	// Where we are: repo › collection › record
	import {collectionPath, repoPath} from '#lib/paths'
	import * as m from '#lib/paraglide/messages.js'

	let {actor, collection, rkey}: {actor: string; collection?: string; rkey?: string} = $props()
</script>

<enform-breadcrumbs>
	<nav aria-label={m.nav_breadcrumb()}>
		<ol>
			<li><a href={repoPath(actor)}>@{actor}</a></li>
			{#if collection}
				<li>
					<a href={collectionPath(actor, collection)} aria-current={rkey ? undefined : 'page'}>
						{collection}
					</a>
				</li>
			{/if}
			{#if rkey}<li aria-current="page">{rkey}</li>{/if}
		</ol>
	</nav>
</enform-breadcrumbs>
