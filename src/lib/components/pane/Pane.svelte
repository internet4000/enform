<script lang="ts">
	// One level of browsing (repo, collection, record). Wide screens show the levels side
	// by side; phones show the deepest one, with a way back up.
	import type {Snippet} from 'svelte'

	type Props = {
		title: string
		subtitle?: string
		/** The level above, for phones */
		back?: {href: string; label: string}
		/** Holds the space of a level not chosen yet; phones skip it */
		placeholder?: boolean
		actions?: Snippet
		/** The heading level: 1 for the first pane (the page's title), 2 for the others */
		level?: 1 | 2
		children?: Snippet
	}
	let {title, subtitle, back, placeholder = false, actions, children, level = 2}: Props = $props()
</script>

<enform-pane placeholder={placeholder || undefined}>
	<header>
		{#if back}<a href={back.href} rel="up">{back.label}</a>{/if}
		<hgroup>
			<svelte:element this={`h${level}`}>{title}</svelte:element>
			{#if subtitle}<p>{subtitle}</p>{/if}
		</hgroup>
		{#if actions}<menu>{@render actions()}</menu>{/if}
	</header>
	{@render children?.()}
</enform-pane>
