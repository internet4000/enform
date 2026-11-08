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
		thing: 'M12 3l8 4.5v9L12 21l-8-4.5v-9z',
		small: 'M4 15h16v4H4z',
		docked: 'M4 5h16v14H4zM14 5v14',
		full: 'M4 9V4h5M15 4h5v5M20 15v5h-5M9 20H4v-5',
		next: 'M9 5l7 7-7 7',
		external: 'M14 4h6v6M20 4l-9 9M18 14v6H4V6h6',
		pin: 'M9 4h6l-1 6 3 3H7l3-3zM12 13v7',
		language:
			'M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18zM3 12h18M12 3c2.5 2.5 3.5 5.5 3.5 9s-1 6.5-3.5 9c-2.5-2.5-3.5-5.5-3.5-9s1-6.5 3.5-9',
		waiting: 'M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18zM12 7v5l3 2',
		source: 'M8 8l-4 4 4 4M16 8l4 4-4 4',
		signout: 'M10 5H5v14h5M14 8l4 4-4 4M18 12H9'
	}

	let {name}: {name: keyof typeof paths} = $props()
</script>

<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
	<path d={paths[name]} />
</svg>
