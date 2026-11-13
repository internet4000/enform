<script lang="ts">
	// A handle to drag (or move with the arrow keys) to resize what is on either side of it
	type Props = {
		label: string
		/** Along which axis it moves: y, between what's above and below; x, beside */
		axis: 'x' | 'y'
		/** Called with how far it moved since the last call, in px */
		onmove: (delta: number) => void
		/** The size it sets now, for assistive technologies (0–100) */
		value?: number
		/** On the edge of what it resizes, rather than between two parts */
		edge?: boolean
	}
	let {label, axis, onmove, value, edge = false}: Props = $props()
	let last = 0
	let dragging = $state(false)

	const at = (event: PointerEvent) => (axis === 'y' ? event.clientY : event.clientX)

	function down(event: PointerEvent) {
		if (event.button !== 0) return
		event.preventDefault()
		;(event.currentTarget as HTMLElement).setPointerCapture(event.pointerId)
		last = at(event)
		dragging = true
	}

	function move(event: PointerEvent) {
		if (!dragging) return
		const now = at(event)
		onmove(now - last)
		last = now
	}

	function key(event: KeyboardEvent) {
		const step = event.shiftKey ? 64 : 16
		const keys: Record<string, number> =
			axis === 'y' ? {ArrowUp: -step, ArrowDown: step} : {ArrowLeft: -step, ArrowRight: step}
		if (event.key in keys) {
			event.preventDefault()
			onmove(keys[event.key])
		}
	}
</script>

<!-- A focusable separator is a widget (ARIA), moved by pointer and keys -->
<!-- svelte-ignore a11y_no_noninteractive_tabindex, a11y_no_noninteractive_element_interactions -->
<enform-resizer
	role="separator"
	tabindex="0"
	aria-label={label}
	aria-orientation={axis === 'y' ? 'horizontal' : 'vertical'}
	aria-valuenow={value === undefined ? undefined : Math.round(value)}
	aria-valuemin={value === undefined ? undefined : 0}
	aria-valuemax={value === undefined ? undefined : 100}
	{axis}
	edge={edge || undefined}
	dragging={dragging || undefined}
	onpointerdown={down}
	onpointermove={move}
	onpointerup={() => (dragging = false)}
	onpointercancel={() => (dragging = false)}
	onkeydown={key}
></enform-resizer>
