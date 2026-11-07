<script lang="ts">
	// A blob: images shown inline, other files linked, all fetched from the repo's PDS
	import * as m from '#lib/paraglide/messages.js'
	import type {Identity} from '#lib/atproto/identity'
	import {blobUrl} from '#lib/atproto/repo'

	let {value, repo}: {value: Record<string, unknown>; repo: Identity} = $props()

	let cid = $derived((value.ref as {$link?: string} | undefined)?.$link ?? (value.cid as string))
	let mimeType = $derived(String(value.mimeType ?? ''))
	let src = $derived(cid ? blobUrl(repo, cid) : undefined)
</script>

<enform-value type="blob" mime-type={mimeType}>
	{#if src && mimeType.startsWith('image/')}
		<a href={src} rel="noopener noreferrer" target="_blank">
			<img {src} alt="" loading="lazy" />
		</a>
	{:else if src}
		<a href={src} rel="noopener noreferrer" target="_blank">
			{m.value_blob({mimeType, size: String(value.size ?? '?')})}
		</a>
	{/if}
</enform-value>
