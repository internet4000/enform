<script lang="ts">
	// A group of Settings' rows (as 4000.radio's and joblist's menus): each a place (a link,
	// going on ›, or out ↗) or an action (a button), with its icon or picture, what it is,
	// and, small, its current value
	import type {ComponentProps} from 'svelte'
	import Icon from './shell/Icon.svelte'

	export type SettingsLink = {
		label: string
		icon: ComponentProps<typeof Icon>['name']
		href?: string
		onclick?: () => void
		value?: string
		external?: boolean
		/** A picture in place of the icon (your avatar), when it comes */
		image?: Promise<string | undefined>
	}
	let {title, items}: {title: string; items: SettingsLink[]} = $props()
	const id = $props.id()
</script>

<enform-settings-links>
	<section aria-labelledby={id}>
		<h2 {id}>{title}</h2>
		<menu>
			{#each items as item (item.label)}
				<li>
					{#if item.href}
						<a
							href={item.href}
							rel={item.external ? 'noopener noreferrer external' : undefined}
							target={item.external ? '_blank' : undefined}
						>
							{#await item.image}
								<Icon name={item.icon} />
							{:then src}
								{#if src}<img {src} alt="" />{:else}<Icon name={item.icon} />{/if}
							{/await}
							<span>{item.label}</span>
							{#if item.value}<small>{item.value}</small>{/if}
							<Icon name={item.external ? 'external' : 'next'} />
						</a>
					{:else}
						<button type="button" onclick={item.onclick}>
							<Icon name={item.icon} />
							<span>{item.label}</span>
						</button>
					{/if}
				</li>
			{/each}
		</menu>
	</section>
</enform-settings-links>
