<script lang="ts">
	// Line icons, drawn in the current text color
	const paths = {
		explore: 'M11 4a7 7 0 1 0 0 14 7 7 0 0 0 0-14zm9 16-4-4',
		new: 'M12 5v14M5 12h14',
		following: 'M4 6h16M4 12h16M4 18h10',
		me: 'M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8zm-7 8a7 7 0 0 1 14 0',
		settings: 'M4 7h10m4 0h2M4 17h4m4 0h8M16 5v4M10 15v4',
		back: 'M15 5l-7 7 7 7'
	}

	let {name}: {name: keyof typeof paths} = $props()
</script>

<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
	<path d={paths[name]} />
</svg>
