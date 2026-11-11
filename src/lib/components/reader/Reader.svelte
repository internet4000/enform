<script lang="ts">
	// The reader, over every page and always at hand, in three modes (like Radio4000's
	// decks): small, a bar whose media play out of sight; docked, beside the page on wide
	// screens and below it on phones; full screen. Prev, next, what's up next (each with its
	// menu), and autoplay on to the next record when one is done. Its record stays mounted
	// in every mode. With several lists at hand, a deck each, as tabs: the one in front
	// plays, the others keep their place.
	import {describeRecord} from '#lib/describe/record'
	import * as m from '#lib/paraglide/messages.js'
	import {typeLabel} from '#lib/apps/directory'
	import {reader, type ReaderItem, type ReaderMode} from '#lib/reader/reader.svelte'
	import Icon from '../shell/Icon.svelte'
	import Present from '../present/Present.svelte'
	import ReaderItemMenu from './ReaderItemMenu.svelte'

	let item = $derived(reader.current)
	const titleOf = (entry: ReaderItem) =>
		describeRecord(entry.record, entry.lexicon).title ?? entry.record.rkey
	let title = $derived(item ? titleOf(item) : '')

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
	<enform-reader mode={reader.mode} role="region" aria-label={m.reader_label()}>
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
						· {typeLabel(item.record.collection)}
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
		{#key `${reader.at}/${item.repo.did}/${item.record.collection}/${item.record.rkey}`}
			<Present
				repo={item.repo}
				record={item.record}
				lexicon={item.lexicon}
				onended={() => reader.ended()}
			/>
		{/key}
		<footer>
			<menu>
				<li>
					<button
						type="button"
						onclick={() => reader.prev()}
						disabled={!reader.hasPrev}
						aria-label={m.reader_prev()}>‹</button
					>
				</li>
				<li>
					<button
						type="button"
						aria-pressed={reader.autoplay}
						onclick={() => (reader.autoplay = !reader.autoplay)}
					>
						{m.reader_autoplay()}
					</button>
				</li>
				<li>
					<a
						href={item.href}
						onclick={() => {
							if (reader.mode === 'full') reader.mode = 'docked'
						}}>{m.reader_open()}</a
					>
				</li>
				<li><ReaderItemMenu entry={item} index={reader.index} {title} /></li>
				<li>
					<button
						type="button"
						onclick={() => reader.next()}
						disabled={!reader.hasNext}
						aria-label={m.reader_next()}>›</button
					>
				</li>
			</menu>
		</footer>
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
	</enform-reader>
{/if}
