<script lang="ts">
	// Line icons, drawn in the current text color
	const paths = {
		explore: 'M11 4a7 7 0 1 0 0 14 7 7 0 0 0 0-14zm9 16-4-4',
		new: 'M12 5v14M5 12h14',
		home: 'M4 4h6v6H4zM14 4h6v6h-6zM4 14h6v6H4zM14 14h6v6h-6z',
		me: 'M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8zm-7 8a7 7 0 0 1 14 0',
		more: 'M4.5 12a1.5 1.5 0 1 0 3 0 1.5 1.5 0 1 0-3 0m6 0a1.5 1.5 0 1 0 3 0 1.5 1.5 0 1 0-3 0m6 0a1.5 1.5 0 1 0 3 0 1.5 1.5 0 1 0-3 0',
		back: 'M15 5l-7 7 7 7',
		profile: 'M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8zm-7 8a7 7 0 0 1 14 0',
		post: 'M5 5h14v10H9l-4 4z',
		link: 'M10 14a4 4 0 0 0 6 0l3-3a4 4 0 0 0-6-6l-1 1m2 4a4 4 0 0 0-6 0l-3 3a4 4 0 0 0 6 6l1-1',
		photo: 'M4 6h16v12H4zm4 8 3-3 3 3 2-2 3 3M9 9.5a1 1 0 1 0 0 .1',
		follow: 'M10 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8zm-6 8a6 6 0 0 1 12 0M18 8v6m-3-3h6',
		reaction: 'M12 20s-7-4.5-7-10a4 4 0 0 1 7-2.5A4 4 0 0 1 19 10c0 5.5-7 10-7 10z',
		status: 'M12 20a8 8 0 1 0 0-16 8 8 0 0 0 0 16zM9 10h.01M15 10h.01M9 14.5a4 4 0 0 0 6 0',
		event: 'M5 6h14v13H5zM5 10h14M9 4v4m6-4v4',
		list: 'M8 6h12M8 12h12M8 18h12M4 6h.01M4 12h.01M4 18h.01',
		thing: 'M12 3l8 4.5v9L12 21l-8-4.5v-9z'
	}

	let {name}: {name: keyof typeof paths} = $props()
</script>

<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
	<path d={paths[name]} />
</svg>
