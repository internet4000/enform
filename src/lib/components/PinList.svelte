<script lang="ts">
	// Your pinned apps, to reorder or unpin
	import * as m from '#lib/paraglide/messages.js'
	import {appInfo} from '#lib/apps/directory'
	import {namespaceOfDomain} from '#lib/apps/names'
	import {pins} from '#lib/apps/pins.svelte'
	import {appPath} from '#lib/paths'
	import AppIcon from './pane/AppIcon.svelte'
</script>

{#if pins.domains.length}
	<enform-pins>
		<ol>
			{#each pins.domains as domain, index (domain)}
				{@const name = appInfo(namespaceOfDomain(domain)).name}
				<li>
					<a href={appPath(domain)}><AppIcon {domain} {name} /><span>{name}</span></a>
					<button
						type="button"
						disabled={index === 0}
						aria-label={m.pins_move_up({app: name})}
						onclick={() => pins.move(domain, -1)}>↑</button
					>
					<button
						type="button"
						disabled={index === pins.domains.length - 1}
						aria-label={m.pins_move_down({app: name})}
						onclick={() => pins.move(domain, 1)}>↓</button
					>
					<button
						type="button"
						aria-label={m.unpin_app({app: name})}
						onclick={() => pins.toggle(domain)}>{m.unpin()}</button
					>
				</li>
			{/each}
		</ol>
	</enform-pins>
	<p><small>{m.pins_hint()}</small></p>
{:else}
	<p>{m.pins_none()}</p>
{/if}
