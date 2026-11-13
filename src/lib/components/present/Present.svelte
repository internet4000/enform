<script lang="ts">
	// A record shown by what it can do (its main capability), else by its kind; when it's
	// done (its media ended, its slideshow shown) it says so, for the reader to go on
	import type {Identity} from '#lib/atproto/identity'
	import type {RepoRecord} from '#lib/atproto/repo'
	import {blobUrl} from '#lib/atproto/repo'
	import type {LexiconDoc} from '#lib/lexicons/types'
	import {capabilitiesOf} from '#lib/capabilities/detect'
	import KindView from '../app/KindView.svelte'
	import ImagesPresenter from './ImagesPresenter.svelte'
	import MediaPresenter from './MediaPresenter.svelte'
	import PlacePresenter from './PlacePresenter.svelte'

	type Props = {
		repo: Identity
		record: RepoRecord
		lexicon?: LexiconDoc
		onended: () => void
		/** Its media element, when it plays one, for controls around it */
		onmedia?: (media: HTMLMediaElement | undefined) => void
	}
	let {repo, record, lexicon, onended, onmedia}: Props = $props()

	let main = $derived(capabilitiesOf(record.value, lexicon)[0])
</script>

<enform-present capability={main?.kind ?? 'kind'}>
	{#if main?.kind === 'media'}
		<MediaPresenter src={main.url} player={main.player} {onended} {onmedia} />
		<KindView {repo} {record} {lexicon} beside />
	{:else if main?.kind === 'blob-media' && !repo.local}
		<MediaPresenter src={blobUrl(repo, main.cid)} player={main.player} {onended} {onmedia} />
		<KindView {repo} {record} {lexicon} beside />
	{:else if main?.kind === 'images'}
		<ImagesPresenter {repo} cids={main.cids} alts={main.alts} {onended} />
		<KindView {repo} {record} {lexicon} beside />
	{:else if main?.kind === 'place'}
		<KindView {repo} {record} {lexicon} />
		<PlacePresenter latitude={main.latitude} longitude={main.longitude} name={main.name} />
	{:else}
		<KindView {repo} {record} {lexicon} />
	{/if}
</enform-present>
