<script lang="ts">
	// Your pins, apps and profiles in apps, to reorder or unpin
	import * as m from '#lib/paraglide/messages.js'
	import {appInfo} from '#lib/apps/directory'
	import {namespaceOfDomain} from '#lib/apps/names'
	import {pins} from '#lib/apps/pins.svelte'
	import {pinnedProfile} from '#lib/apps/pinned'
	import type {Pin} from '#lib/apps/pins'
	import {appPath} from '#lib/paths'
	import AppIcon from './pane/AppIcon.svelte'

	/** What a pin is called, to say which one moves */
	async function labelOf(pin: Pin, name: string) {
		if (!pin.did) return name
		const {actor} = await pinnedProfile({did: pin.did, domain: pin.domain})
		return m.pin_profile_name({actor, app: name})
	}
</script>

{#if pins.keys.length}
	<enform-pins>
		<ol>
			{#each pins.all as pin, index (`${pin.did ?? ''}/${pin.domain}`)}
				{@const name = appInfo(namespaceOfDomain(pin.domain)).name}
				{#await labelOf(pin, name) then label}
					<li>
						{#if pin.did}
							{#await pinnedProfile({did: pin.did, domain: pin.domain}) then profile}
								<a href={profile.href}><AppIcon domain={pin.domain} {name} /><span>{label}</span></a
								>
							{/await}
						{:else}
							<a href={appPath(pin.domain)}
								><AppIcon domain={pin.domain} {name} /><span>{name}</span></a
							>
						{/if}
						<button
							type="button"
							disabled={index === 0}
							aria-label={m.pins_move_up({app: label})}
							onclick={() => pins.move(pin, -1)}>↑</button
						>
						<button
							type="button"
							disabled={index === pins.keys.length - 1}
							aria-label={m.pins_move_down({app: label})}
							onclick={() => pins.move(pin, 1)}>↓</button
						>
						<button
							type="button"
							aria-label={m.unpin_app({app: label})}
							onclick={() => pins.toggle(pin.domain, pin.did)}>{m.unpin()}</button
						>
					</li>
				{/await}
			{/each}
		</ol>
	</enform-pins>
	<p><small>{m.pins_hint()}</small></p>
{:else}
	<p>{m.pins_none()}</p>
{/if}
