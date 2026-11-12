<script lang="ts">
	// A group of Settings' rows (as Bluesky's, 4000.radio's and joblist's menus): each a
	// place (a link, going on ›, or out ↗) or an action (a button), with its icon or
	// picture, what it is, and, small, its current value or the faces behind it
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
		/** Who is behind it (the other accounts), side by side before the chevron */
		faces?: Promise<string | undefined>[]
	}
	let {title, items}: {title?: string; items: SettingsLink[]} = $props()
	const id = $props.id()
</script>

<enform-settings-links>
	<section aria-labelledby={title ? id : undefined}>
		{#if title}<h2 {id}>{title}</h2>{/if}
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
							{#if item.faces?.length}
								<enform-faces>
									{#each item.faces as face, index (index)}
										{#await face then src}{#if src}<img {src} alt="" />{/if}{/await}
									{/each}
								</enform-faces>
							{/if}
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
