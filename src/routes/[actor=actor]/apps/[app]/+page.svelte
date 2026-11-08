<script lang="ts">
	// An app as a person has it: its types as tabs (Radio · Tracks · Followed radios), their
	// records as cards, and, over it, a record or a form. The owner adds with the + button.
	import {page} from '$app/state'
	import * as m from '#lib/paraglide/messages.js'
	import {auth} from '#lib/auth/session.svelte'
	import {blobUrl, getRecord} from '#lib/atproto/repo'
	import {appInfo, byDirectory, typeLabel} from '#lib/apps/directory'
	import type {AppSingle, AppType} from '#lib/apps/types'
	import {resolveLexicon} from '#lib/lexicons/resolve'
	import {recordCard} from '#lib/records/card'
	import {recordSummary} from '#lib/records/summary'
	import {kindOf} from '#lib/records/kinds'
	import {kindVerb} from '#lib/records/kind-words'
	import AppIcon from '#lib/components/pane/AppIcon.svelte'
	import AppActions from '#lib/components/app/AppActions.svelte'
	import AppMenu from '#lib/components/app/AppMenu.svelte'
	import PinButton from '#lib/components/PinButton.svelte'
	import KindView from '#lib/components/app/KindView.svelte'
	import RecordGrid from '#lib/components/app/RecordGrid.svelte'
	import RecordSheet from '#lib/components/app/RecordSheet.svelte'
	import CreateRecord from '#lib/components/CreateRecord.svelte'
	import EditRecord from '#lib/components/EditRecord.svelte'
	import RecordActions from '#lib/components/RecordActions.svelte'
	import RecordValue from '#lib/components/RecordValue.svelte'
	import {actorName, appScreenPath, collectionPath, dataPath, inApp, repoPath} from '#lib/paths'

	let {data} = $props()
	let actor = $derived(actorName(data.repo))
	let owner = $derived(auth.owns(data.repo))
	let app = $derived(data.app)
	let info = $derived(appInfo(app.namespace))

	const single = (type: AppType): type is AppSingle => 'rkey' in type

	/** The tabs: its profile, then the types with records; the owner sees the others too */
	let tabs = $derived.by(() => {
		const profile =
			app.profile && (app.profile.record || (owner && app.profile.lexicon)) ? [app.profile] : []
		const used = byDirectory([...app.lists, ...app.singles].filter((type) => type.used))
		return [...profile, ...used]
	})
	/** What can be started here: the types with a lexicon this repo has nothing of */
	let startable = $derived(
		byDirectory([
			...(app.profile && !app.profile.record && app.profile.lexicon ? [app.profile] : []),
			...app.lists.filter((type) => !type.used && type.lexicon)
		])
	)
	/** What the panel offers: for the owner, what to start; for others, all the app does */
	let doable = $derived(
		owner
			? startable
			: byDirectory(
					[...(app.profile?.lexicon ? [app.profile] : []), ...app.lists].filter(
						(type) => type.lexicon
					)
				)
	)
	let me = $derived(auth.me ? actorName(auth.me) : undefined)
	/** Starting a type: here for the owner, else in your own repo's screen of this app */
	let start = $derived(
		owner
			? (type: string) => appScreenPath(actor, app.app, {type, create: true})
			: me
				? (type: string) => appScreenPath(me as string, app.app, {type, create: true})
				: undefined
	)

	let params = $derived(page.url.searchParams)
	let selected = $derived(
		[...tabs, ...startable].find((type) => type.nsid === params.get('type')) ??
			tabs.find((type) => !single(type)) ??
			tabs[0]
	)
	let lexicon = $derived(
		selected ? resolveLexicon(selected.nsid).catch(() => undefined) : undefined
	)
	let open = $derived(params.get('record') ?? undefined)
	let creating = $derived(owner && params.has('new'))
	let editing = $derived(owner && params.has('edit'))
	let base = $derived(selected ? appScreenPath(actor, app.app, {type: selected.nsid}) : '')
	/** Which app and whose data, for sheets that cover the app's header on phones */
	let context = $derived(
		`${info.name}${info.name.toLowerCase() === info.domain ? '' : ` · ${info.domain}`} · ${
			owner ? m.whose_yours() : m.whose_theirs({actor: `@${actor}`})
		}`
	)
	const at = (type: string, open: {record?: string; edit?: boolean; create?: boolean} = {}) =>
		appScreenPath(actor, app.app, {type, ...open})
</script>

<enform-app-screen>
	<header>
		<a href={repoPath(actor)} rel="up">@{actor}</a>
		<hgroup>
			<AppIcon domain={info.domain} name={info.name} />
			<h1>{info.name}</h1>
			<!-- Which app (its domain) and whose data: never in doubt -->
			<p>
				{#if info.name.toLowerCase() !== info.domain}<span>{info.domain}</span>{/if}
				<enform-whose mine={owner || undefined}>
					{owner ? m.whose_yours() : m.whose_theirs({actor: `@${actor}`})}
				</enform-whose>
			</p>
		</hgroup>
		<!-- The app at hand: pin it; open it, read what it is, see its data, in its menu -->
		<menu>
			<li><PinButton domain={info.domain} name={info.name} /></li>
			<li>
				<AppMenu {info} data={selected ? collectionPath(actor, selected.nsid) : dataPath(actor)} />
			</li>
		</menu>
		{#if info.description}<p>{info.description}</p>{/if}
	</header>

	{#if tabs.length}
		<nav aria-label={m.app_tabs()}>
			<ul>
				{#each tabs as type (type.nsid)}
					<li>
						<a
							href={at(type.nsid)}
							aria-current={selected?.nsid === type.nsid ? 'page' : undefined}
						>
							{typeLabel(type.nsid)}
						</a>
					</li>
				{/each}
			</ul>
		</nav>
	{/if}

	{#if !selected}
		{#if !owner}<p>{m.app_screen_empty({app: info.name})}</p>{/if}
		<AppActions types={doable} href={start} title={m.actions_title({app: info.name})} />
		{#if !owner && !me}<p><small>{m.actions_view_only({app: info.name})}</small></p>{/if}
	{:else if single(selected)}
		<!-- One record per account: shown whole -->
		{#await getRecord(data.repo, selected.nsid, selected.rkey)}
			<p><small>{m.collection_loading()}</small></p>
		{:then record}
			{@const card = recordCard(record.value, selected.lexicon?.defs.main?.record)}
			<enform-person>
				{#if card.banner && !data.repo.local}<img
						src={blobUrl(data.repo, card.banner)}
						alt=""
					/>{/if}
				<figure>
					{#if card.avatar && !data.repo.local}<img
							src={blobUrl(data.repo, card.avatar)}
							alt=""
						/>{/if}
					<figcaption>
						<h2>{card.title ?? typeLabel(selected.nsid)}</h2>
						{#if card.text}<p>{card.text}</p>{/if}
					</figcaption>
				</figure>
			</enform-person>
			{#if owner}
				<p>
					<a href={at(selected.nsid, {record: selected.rkey, edit: true})} role="button"
						>{m.record_edit()}</a
					>
				</p>
			{/if}
			<details>
				<summary>{m.app_all_fields()}</summary>
				<RecordValue
					value={record.value}
					node={selected.lexicon?.defs.main?.record}
					base={selected.nsid}
					repo={data.repo}
					typed={false}
				/>
			</details>
		{:catch}
			{#if owner}
				<p>
					<a href={at(selected.nsid, {create: true})} role="button">
						{m.app_create_profile({app: info.name})}
					</a>
				</p>
			{:else}
				<p>{m.collection_records_empty()}</p>
			{/if}
		{/await}
	{:else}
		{#await lexicon then doc}
			<RecordGrid
				repo={data.repo}
				collection={selected.nsid}
				lexicon={doc}
				href={(rkey) => at(selected.nsid, {record: rkey})}
				{open}
			/>
		{/await}
		{#if owner && selected.lexicon}
			<enform-fab>
				<a href={at(selected.nsid, {create: true})} role="button">
					+ {m.app_new({type: typeLabel(selected.nsid)})}
				</a>
			</enform-fab>
		{/if}
	{/if}

	{#if selected && doable.length}
		<AppActions
			types={doable.filter((type) => type.nsid !== selected.nsid)}
			href={start}
			title={owner ? m.actions_more({app: info.name}) : m.actions_title({app: info.name})}
		/>
	{/if}
</enform-app-screen>

{#if selected && creating}
	<RecordSheet
		title={kindVerb(kindOf(selected.lexicon).kind, typeLabel(selected.nsid)).verb}
		subtitle={context}
		close={base}
	>
		{#await lexicon then doc}
			{#if doc}
				<CreateRecord
					lexicon={doc}
					created={(collection, rkey) => at(collection, {record: rkey})}
					editing={(collection, rkey) => at(collection, {record: rkey, edit: true})}
				/>
			{/if}
		{/await}
	</RecordSheet>
{:else if selected && open}
	{#await Promise.all([getRecord(data.repo, selected.nsid, open), lexicon]) then [record, doc]}
		{#if editing && doc}
			<RecordSheet
				title={m.edit_title()}
				subtitle={`${typeLabel(selected.nsid)} · ${context}`}
				close={at(selected.nsid, {record: open})}
			>
				<EditRecord
					lexicon={doc}
					{actor}
					rkey={open}
					{record}
					saved={at(selected.nsid, {record: open})}
				/>
			</RecordSheet>
		{:else}
			<RecordSheet
				title={recordSummary(record.value, doc?.defs.main?.record) ?? typeLabel(selected.nsid)}
				subtitle={`${typeLabel(selected.nsid)} · ${context}`}
				close={base}
			>
				{#if owner}
					<menu>
						<RecordActions
							{actor}
							collection={selected.nsid}
							rkey={open}
							cid={record.cid}
							editHref={at(selected.nsid, {record: open, edit: true})}
							deleted={base}
						/>
					</menu>
					<!-- Keep going: the next one, without closing this one first -->
					{#if selected.lexicon}
						<p>
							<a href={at(selected.nsid, {create: true})} role="button">
								+ {m.app_new({type: typeLabel(selected.nsid)})}
							</a>
						</p>
					{/if}
				{/if}
				{#if record.pending}
					<p role="status"><a href={inApp('/more#waiting')}>{m.outbox_record_waiting()}</a></p>
				{/if}
				<KindView repo={data.repo} {record} lexicon={doc} />
				<details open={kindOf(doc).kind === 'thing' || undefined}>
					<summary>{m.app_all_fields()}</summary>
					<RecordValue
						value={record.value}
						node={doc?.defs.main?.record}
						base={selected.nsid}
						repo={data.repo}
						typed={false}
					/>
				</details>
				<details>
					<summary>{m.record_raw()}</summary>
					<pre>{JSON.stringify(record, null, 2)}</pre>
				</details>
			</RecordSheet>
		{/if}
	{:catch}
		<RecordSheet title={typeLabel(selected.nsid)} close={base}>
			<p>{m.error_not_found()}</p>
		</RecordSheet>
	{/await}
{/if}
