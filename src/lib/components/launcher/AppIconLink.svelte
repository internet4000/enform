<script lang="ts">
	// An app as on a phone's home screen: its icon and name, opening it
	import AppIcon from '../pane/AppIcon.svelte'

	type Props = {href: string; domain: string; name: string; note?: string}
	let {href, domain, name, note}: Props = $props()
</script>

<enform-app-link>
	<a {href}>
		<AppIcon {domain} {name} />
		<span>{name}</span>
		{#if note}<small>{note}</small>{/if}
	</a>
</enform-app-link>
