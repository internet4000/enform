<script lang="ts">
	// Media from a link or a file: the provider's own player, behind the <audio>/<video>
	// API (media elements by Mux), loaded when needed; it says when it has ended, and gives
	// its element to whoever controls it (the reader)
	import type {Player} from '#lib/capabilities/detect'

	type Props = {
		src: string
		player: Player
		onended: () => void
		onmedia?: (media: HTMLMediaElement | undefined) => void
	}
	let {src, player, onended, onmedia}: Props = $props()
	let media = $state<HTMLMediaElement>()

	$effect(() => {
		const el = media
		if (!el || !onmedia) return
		onmedia(el)
		return () => onmedia(undefined)
	})

	const loaders: Partial<Record<Player, () => Promise<unknown>>> = {
		youtube: () => import('youtube-video-element'),
		vimeo: () => import('vimeo-video-element'),
		spotify: () => import('spotify-audio-element')
	}
	let ready = $state(false)

	// The provider's player element, loaded when first needed
	$effect(() => {
		const load = loaders[player]
		ready = !load
		load?.().then(() => (ready = true))
	})

	/** SoundCloud's embedded player: plays, but doesn't say when it ends */
	let soundcloud = $derived(
		`https://w.soundcloud.com/player/?url=${encodeURIComponent(src)}&auto_play=true&visual=true`
	)
</script>

<enform-media {player}>
	{#if !ready}
		<!-- loading the provider's player -->
	{:else if player === 'youtube'}
		<youtube-video bind:this={media} {src} controls autoplay {onended}></youtube-video>
	{:else if player === 'vimeo'}
		<vimeo-video bind:this={media} {src} controls autoplay {onended}></vimeo-video>
	{:else if player === 'spotify'}
		<spotify-audio bind:this={media} {src} controls autoplay {onended}></spotify-audio>
	{:else if player === 'soundcloud'}
		<iframe src={soundcloud} title="SoundCloud" allow="autoplay"></iframe>
	{:else if player === 'video'}
		<!-- svelte-ignore a11y_media_has_caption -->
		<video bind:this={media} {src} controls autoplay {onended}></video>
	{:else}
		<audio bind:this={media} {src} controls autoplay {onended}></audio>
	{/if}
</enform-media>
