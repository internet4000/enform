<script lang="ts">
	// A string, shown by its lexicon format: links for URIs and identities, dates as times
	import {formatDate} from '#lib/dates'
	import {atUriPath, repoPath} from '#lib/paths'

	let {value, format}: {value: string; format?: string} = $props()

	let href = $derived.by(() => {
		if (format === 'at-uri') return atUriPath(value)
		if (format === 'did' || format === 'handle' || format === 'at-identifier')
			return repoPath(value)
		if (format === 'uri' && /^https?:\/\//.test(value)) return value
		return undefined
	})
	let external = $derived(format === 'uri')
	let date = $derived(format === 'datetime' && !Number.isNaN(Date.parse(value)))
</script>

<enform-value type="string" {format}>
	{#if date}
		<time datetime={value}>{formatDate(value)}</time>
	{:else if href && external}
		<a {href} rel="noopener noreferrer external" target="_blank">{value}</a>
	{:else if href}
		<a {href}>{value}</a>
	{:else}
		{value}
	{/if}
</enform-value>
