<script lang="ts">
	// The reader, over every page: full screen while reading, a bar while you browse (its
	// media keep playing). Prev, next, and autoplay on to the next record when one is done.
	import * as m from '#lib/paraglide/messages.js'
	import {typeLabel} from '#lib/apps/directory'
	import {reader} from '#lib/reader/reader.svelte'
	import {recordSummary} from '#lib/records/summary'
	import Present from '../present/Present.svelte'

	let item = $derived(reader.current)
	let title = $derived(
		item
			? (recordSummary(item.record.value, item.lexicon?.defs.main?.record) ?? item.record.rkey)
			: ''
	)

	function keys(event: KeyboardEvent) {
		if (!reader.expanded || !reader.active) return
		if (event.target instanceof HTMLInputElement || event.target instanceof HTMLTextAreaElement)
			return
		if (event.key === 'ArrowRight') void reader.next()
		if (event.key === 'ArrowLeft') reader.prev()
		if (event.key === 'Escape') reader.expanded = false
	}
</script>

<svelte:window onkeydown={keys} />

{#if item}
	<enform-reader
		expanded={reader.expanded || undefined}
		role="region"
		aria-label={m.reader_label()}
	>
		<header>
			<button
				type="button"
				onclick={() => (reader.expanded = !reader.expanded)}
				aria-label={reader.expanded ? m.reader_minimize() : m.reader_expand()}
				aria-expanded={reader.expanded}
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
			<button type="button" onclick={() => reader.close()} aria-label={m.reader_close()}>×</button>
		</header>
		{#key `${item.repo.did}/${item.record.collection}/${item.record.rkey}`}
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
					<a href={item.href} onclick={() => (reader.expanded = false)}>{m.reader_open()}</a>
				</li>
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
	</enform-reader>
{/if}
