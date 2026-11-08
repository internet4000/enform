<script lang="ts">
	// Actions one taps without looking for them: each with its app's icon, what it does, and
	// in which app and type. Some open a form already started (state.prefill)
	import {goto} from '$app/navigation'
	import AppIcon from './pane/AppIcon.svelte'

	export type QuickLink = {
		href: string
		domain: string
		app: string
		verb: string
		detail: string
		/** Fields the form opens with */
		prefill?: Record<string, unknown>
	}
	let {title, items}: {title: string; items: QuickLink[]} = $props()
	const id = $props.id()

	function open(event: MouseEvent, item: QuickLink) {
		if (!item.prefill || event.metaKey || event.ctrlKey || event.shiftKey) return
		event.preventDefault()
		goto(item.href, {state: {prefill: item.prefill}})
	}
</script>

{#if items.length}
	<section aria-labelledby={id}>
		<h2 {id}>{title}</h2>
		<enform-quick>
			<ul>
				{#each items as item (item.href + item.verb)}
					<li>
						<a href={item.href} onclick={(event) => open(event, item)}>
							<AppIcon domain={item.domain} name={item.app} />
							<strong>{item.verb}</strong>
							<small>{item.app} · {item.detail}</small>
						</a>
					</li>
				{/each}
			</ul>
		</enform-quick>
	</section>
{/if}
