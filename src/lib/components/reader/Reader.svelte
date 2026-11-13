<script lang="ts">
	// The reader, over every page and always at hand, in three modes (like Radio4000's
	// decks): small, a bar whose media play out of sight; docked, beside the page on wide
	// screens and below it on phones; full screen. Prev, next, what's up next (each with its
	// menu), and autoplay on to the next record when one is done. Its record stays mounted
	// in every mode. With several lists at hand, a deck each, as tabs: the one in front
	// plays, the others keep their place. Its record and media keep the share of it one
	// gave them (dragged, between them and the list), whatever the record's length; docked,
	// its edge resizes it. Its controls at its foot, as 4000.radio's.
	import {describeRecord} from '#lib/describe/record'
	import * as m from '#lib/paraglide/messages.js'
	import {appInfo, typeLabel} from '#lib/apps/directory'
	import {appOf, namespaceOf} from '#lib/apps/names'
	import {actorName, appScreenPath, lexiconPath, repoPath} from '#lib/paths'
	import AppIcon from '../pane/AppIcon.svelte'
	import {reader, type ReaderItem, type ReaderMode} from '#lib/reader/reader.svelte'
	import Icon from '../shell/Icon.svelte'
	import Present from '../present/Present.svelte'
	import ReaderItemMenu from './ReaderItemMenu.svelte'
	import PlayerControls from './PlayerControls.svelte'
	import Resizer from './Resizer.svelte'
	import {clamp, sizes} from '#lib/reader/sizes.svelte'

	let element = $state<HTMLElement>()
	/** The media playing, when the record has some */
	let media = $state<HTMLMediaElement>()
	/** Each deck's media, so the controls follow the deck in front */
	const medias = new Map<string, HTMLMediaElement | undefined>()
	$effect(() => {
		const key = reader.deck?.list.key
		media = key ? medias.get(key) : undefined
	})
	let split = $derived(sizes.value.split ?? 0.55)

	/** Docked: its width beside the page, its height above the tab bar, as dragged */
	$effect(() => {
		const root = document.documentElement.style
		const {width, height} = sizes.value
		if (width) root.setProperty('--reader-width', `${width}px`)
		if (height) root.setProperty('--reader-docked-height', `${height}px`)
	})

	function resizeSplit(delta: number) {
		const height = element?.clientHeight
		if (height) sizes.set({split: clamp(split + delta / height, 0.2, 0.85)})
	}

	function resizeWidth(delta: number) {
		const width = element?.offsetWidth
		if (width) sizes.set({width: clamp(width - delta, 256, window.innerWidth * 0.6)})
	}

	function resizeHeight(delta: number) {
		const height = element?.offsetHeight
		if (height) sizes.set({height: clamp(height - delta, 160, window.innerHeight * 0.85)})
	}

	let item = $derived(reader.current)
	const titleOf = (entry: ReaderItem) =>
		describeRecord(entry.record, entry.lexicon).title ?? entry.record.rkey
	let title = $derived(item ? titleOf(item) : '')
	/** Where it plays from: whose repo, which app, which type (its lexicon) */
	let actor = $derived(item ? actorName(item.repo) : '')
	let domain = $derived(item ? appOf(item.record.collection) : '')
	let app = $derived(item ? appInfo(namespaceOf(item.record.collection)) : undefined)

	const modes: {mode: ReaderMode; label: () => string}[] = [
		{mode: 'small', label: m.reader_small},
		{mode: 'docked', label: m.reader_docked},
		{mode: 'full', label: m.reader_full}
	]

	function keys(event: KeyboardEvent) {
		if (reader.mode !== 'full' || !reader.active) return
		if (event.target instanceof HTMLInputElement || event.target instanceof HTMLTextAreaElement)
			return
		if (event.key === 'ArrowRight') void reader.next()
		if (event.key === 'ArrowLeft') reader.prev()
		// Escape closes an open menu first; then it leaves full screen
		if (event.key === 'Escape' && !document.querySelector(':popover-open')) reader.mode = 'docked'
	}
</script>

<svelte:window onkeydown={keys} />

{#if item}
	<enform-reader
		bind:this={element}
		mode={reader.mode}
		role="region"
		aria-label={m.reader_label()}
		style="--reader-split: {split * 100}%"
	>
		{#if reader.mode === 'docked'}
			<!-- Its edge: beside the page on wide screens, above the tab bar on phones -->
			<Resizer label={m.reader_resize()} axis="x" edge onmove={resizeWidth} />
			<Resizer label={m.reader_resize()} axis="y" edge onmove={resizeHeight} />
		{/if}
		<header>
			<!-- The small bar opens the reader where it was docked -->
			<button
				type="button"
				onclick={() => (reader.mode = reader.mode === 'small' ? 'docked' : reader.mode)}
				disabled={reader.mode !== 'small'}
			>
				<hgroup>
					<strong>{title}</strong>
					<small>
						{m.reader_position({
							index: String(reader.index + 1),
							count: String(reader.items.length)
						})}
						· {typeLabel(item.record.collection)} · @{actor}
					</small>
				</hgroup>
			</button>
			<menu aria-label={m.reader_mode()}>
				{#each modes as { mode, label } (mode)}
					<li>
						<button
							type="button"
							aria-label={label()}
							title={label()}
							aria-pressed={reader.mode === mode}
							onclick={() => (reader.mode = mode)}
						>
							<Icon name={mode} />
						</button>
					</li>
				{/each}
				<li>
					<button type="button" onclick={() => reader.close()} aria-label={m.reader_close()}
						>×</button
					>
				</li>
			</menu>
		</header>
		{#if reader.mode !== 'small'}
			<!-- Where it plays from: the app, the profile, the type (its lexicon) -->
			<nav aria-label={m.reader_from()} data-from>
				<a href={appScreenPath(actor, domain)}>
					<AppIcon {domain} name={app?.name ?? domain} />{domain}
				</a>
				<a href={repoPath(actor)}>@{actor}</a>
				<a href={lexiconPath(item.record.collection)}><code>{item.record.collection}</code></a>
			</nav>
		{/if}
		{#if reader.decks.length > 1}
			<nav aria-label={m.reader_decks()}>
				<ul>
					{#each reader.decks as deck, at (deck.list.key)}
						{@const name = deck.list.name || titleOf(deck.items[deck.index] ?? deck.items[0])}
						<li>
							<button
								type="button"
								aria-current={at === reader.at || undefined}
								onclick={() => reader.show(at)}>{name}</button
							>
							<button
								type="button"
								aria-label={m.reader_deck_close({name})}
								onclick={() => reader.closeDeck(at)}>×</button
							>
						</li>
					{/each}
				</ul>
			</nav>
		{/if}
		<!-- Every deck's record stays mounted, the one in front shown: switching decks
		     never stops what another plays -->
		{#each reader.decks as deck, at (deck.list.key)}
			{@const entry = deck.items[deck.index]}
			{#if entry}
				{#key `${entry.repo.did}/${entry.record.collection}/${entry.record.rkey}`}
					<Present
						repo={entry.repo}
						record={entry.record}
						lexicon={entry.lexicon}
						hidden={at !== reader.at}
						onended={() => reader.ended(deck)}
						onmedia={(found) => {
							if (at === reader.at) media = found
							medias.set(deck.list.key, found)
						}}
					/>
				{/key}
			{/if}
		{/each}
		{#if reader.mode !== 'small' && reader.items.length > 1}
			<Resizer label={m.reader_resize_split()} axis="y" onmove={resizeSplit} value={split * 100} />
		{/if}
		{#if reader.items.length > 1}
			<section aria-labelledby="reader-queue">
				<h2 id="reader-queue">{m.reader_queue()}</h2>
				<ol>
					{#each reader.items as entry, index (`${entry.repo.did}/${entry.record.uri}`)}
						{@const name = titleOf(entry)}
						<li>
							<button
								type="button"
								aria-current={index === reader.index || undefined}
								onclick={() => reader.go(index)}>{name}</button
							>
							<ReaderItemMenu {entry} {index} title={name} />
						</li>
					{/each}
				</ol>
			</section>
		{/if}
		<footer>
			<PlayerControls {media}>
				<li>
					<a
						href={item.href}
						onclick={() => {
							if (reader.mode === 'full') reader.mode = 'docked'
						}}>{m.reader_open()}</a
					>
				</li>
				<li><ReaderItemMenu entry={item} index={reader.index} {title} /></li>
			</PlayerControls>
		</footer>
	</enform-reader>
{/if}
