<script lang="ts">
	// The reader's controls, as on 4000.radio: how far the media is (played, a range to
	// seek, what's left, its length), then previous, play or pause, next, volume, and
	// autoplay. Any media element (audio, video, YouTube, Vimeo, Spotify) by the same API;
	// without one (a post, a photo), previous and next only.
	import * as m from '#lib/paraglide/messages.js'
	import {reader} from '#lib/reader/reader.svelte'
	import Icon from '../shell/Icon.svelte'
	import type {Snippet} from 'svelte'

	let {media, children}: {media?: HTMLMediaElement; children?: Snippet} = $props()

	let time = $state(0)
	let duration = $state(NaN)
	let paused = $state(true)
	let volume = $state(1)
	let muted = $state(false)

	// Follow the media element at hand
	$effect(() => {
		const el = media
		if (!el) return
		const read = () => {
			time = el.currentTime || 0
			duration = el.duration
			paused = el.paused
			volume = el.volume ?? 1
			muted = el.muted ?? false
		}
		read()
		const events = [
			'timeupdate',
			'durationchange',
			'loadedmetadata',
			'play',
			'pause',
			'volumechange'
		]
		for (const name of events) el.addEventListener(name, read)
		return () => {
			for (const name of events) el.removeEventListener(name, read)
		}
	})

	let known = $derived(Number.isFinite(duration) && duration > 0)
	let fill = $derived(known ? (time / duration) * 100 : 0)

	function clock(seconds: number) {
		if (!Number.isFinite(seconds)) return '-:--'
		const s = Math.max(0, Math.floor(seconds))
		const h = Math.floor(s / 3600)
		const mm = String(Math.floor((s % 3600) / 60)).padStart(h ? 2 : 1, '0')
		const ss = String(s % 60).padStart(2, '0')
		return h ? `${h}:${mm}:${ss}` : `${mm}:${ss}`
	}

	function toggle() {
		if (!media) return
		if (media.paused) void media.play()?.catch(() => {})
		else media.pause()
	}
</script>

<enform-player-controls>
	{#if media}
		<enform-progress>
			<time>{clock(time)}</time>
			<input
				type="range"
				min="0"
				max={known ? duration : 0}
				step="any"
				value={time}
				disabled={!known}
				aria-label={m.reader_seek()}
				style="--range-fill: {fill}%"
				oninput={(event) => {
					if (media) media.currentTime = Number(event.currentTarget.value)
				}}
			/>
			<time data-remaining>-{clock(known ? duration - time : NaN)}</time>
			<time>{clock(duration)}</time>
		</enform-progress>
	{/if}
	<menu>
		<li>
			<button
				type="button"
				onclick={() => reader.prev()}
				disabled={!reader.hasPrev}
				aria-label={m.reader_prev()}
				title={m.reader_prev()}><Icon name="skip-previous" /></button
			>
		</li>
		{#if media}
			<li>
				<button
					type="button"
					data-play
					onclick={toggle}
					aria-label={paused ? m.reader_play() : m.reader_pause()}
					title={paused ? m.reader_play() : m.reader_pause()}
					><Icon name={paused ? 'play' : 'pause'} /></button
				>
			</li>
		{/if}
		<li>
			<button
				type="button"
				onclick={() => reader.next()}
				disabled={!reader.hasNext}
				aria-label={m.reader_next()}
				title={m.reader_next()}><Icon name="skip-next" /></button
			>
		</li>
		{#if media}
			<li>
				<enform-volume>
					<button
						type="button"
						aria-pressed={muted}
						aria-label={m.reader_mute()}
						title={m.reader_mute()}
						onclick={() => {
							if (media) media.muted = !media.muted
						}}><Icon name={muted || volume === 0 ? 'muted' : 'volume'} /></button
					>
					<input
						type="range"
						min="0"
						max="1"
						step="0.05"
						value={muted ? 0 : volume}
						aria-label={m.reader_volume()}
						style="--range-fill: {(muted ? 0 : volume) * 100}%"
						oninput={(event) => {
							if (!media) return
							media.volume = Number(event.currentTarget.value)
							media.muted = media.volume === 0
						}}
					/>
				</enform-volume>
			</li>
		{/if}
		<li>
			<button
				type="button"
				aria-pressed={reader.autoplay}
				aria-label={m.reader_autoplay()}
				title={m.reader_autoplay()}
				onclick={() => (reader.autoplay = !reader.autoplay)}><Icon name="autoplay" /></button
			>
		</li>
		{@render children?.()}
	</menu>
</enform-player-controls>
