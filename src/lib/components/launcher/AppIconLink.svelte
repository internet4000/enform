<script lang="ts">
	// An app as on a phone's home screen: its icon, its name and its domain, opening it
	import AppIcon from '../pane/AppIcon.svelte'

	type Props = {href: string; domain: string; name: string; note?: string}
	let {href, domain, name, note}: Props = $props()
	// An app is its domain: two apps may share a name or an icon, never a domain
	let detail = $derived(note ?? (name.toLowerCase() === domain ? undefined : domain))
</script>

<enform-app-link>
	<a {href}>
		<AppIcon {domain} {name} />
		<span>{name}</span>
		{#if detail}<small>{detail}</small>{/if}
	</a>
</enform-app-link>
