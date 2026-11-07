<script lang="ts">
	import * as m from '#lib/paraglide/messages.js'
	import {actorName, repoPath} from '#lib/paths'

	let {data, children} = $props()
</script>

<enform-repo verified={!!data.repo.handle}>
	<h1><a href={repoPath(actorName(data.repo))}>@{actorName(data.repo)}</a></h1>
	<dl>
		<div>
			<dt>{m.repo_did()}</dt>
			<dd><code>{data.repo.did}</code></dd>
		</div>
		<div>
			<dt>{m.repo_pds()}</dt>
			<dd>{new URL(data.repo.pds).host}</dd>
		</div>
		{#if !data.repo.handle}
			<div><dt>{m.repo_handle_unverified()}</dt></div>
		{/if}
	</dl>
</enform-repo>
{@render children()}
