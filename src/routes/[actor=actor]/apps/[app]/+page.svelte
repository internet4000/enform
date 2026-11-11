<script lang="ts">
	// An app as a person has it: its types as tabs (Radio · Tracks · Followed radios), their
	// records as cards under a toolbar (how many, play all, + New and what else to make),
	// and, over it, a record or a form. On phones, + New is also a button in thumb reach.
	import {describeRecord} from '#lib/describe/record'
	import * as m from '#lib/paraglide/messages.js'
	import {shownUrl} from '#lib/where.svelte'
	import {auth} from '#lib/auth/session.svelte'
	import {blobUrl, getRecord} from '#lib/atproto/repo'
	import {appInfo, byDirectory, typeLabel} from '#lib/apps/directory'
	import type {AppSingle, AppType} from '#lib/apps/types'
	import {resolveLexicon} from '#lib/lexicons/resolve'
	import {recordCard} from '#lib/records/card'
	import {filterParams} from '#lib/records/filters'
	import {kindOf} from '#lib/records/kinds'
	import {kindVerb} from '#lib/records/kind-words'
	import AppActions from '#lib/components/app/AppActions.svelte'
	import AppMenu from '#lib/components/app/AppMenu.svelte'
	import AppOwner from '#lib/components/app/AppOwner.svelte'
	import NewMenu from '#lib/components/app/NewMenu.svelte'
	import RecordGrid from '#lib/components/app/RecordGrid.svelte'
	import TypeShelf from '#lib/components/app/TypeShelf.svelte'
	import RecordSheet from '#lib/components/app/RecordSheet.svelte'
	import RecordActionsMenu from '#lib/components/app/RecordActionsMenu.svelte'
	import RecordViews from '#lib/components/app/RecordViews.svelte'
	import {reader} from '#lib/reader/reader.svelte'
	import CreateRecord from '#lib/components/CreateRecord.svelte'
	import EditRecord from '#lib/components/EditRecord.svelte'
	import RecordActions from '#lib/components/RecordActions.svelte'
	import {actorName, appScreenPath, collectionPath, dataPath, inApp, recordPath} from '#lib/paths'

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
	/** What one can make here, from the app's lexicons: its profile until one has it, and
	    every list type (what one has only one of is edited from its tab) */
	let makeable = $derived(
		byDirectory([
			...(app.profile && !app.profile.record && app.profile.lexicon ? [app.profile] : []),
			...app.lists.filter((type) => type.lexicon)
		])
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

	/** What the profile has in this app: its repo's lists of the app's types, as the tabs
	    order them */
	let shelves = $derived(tabs.filter((type) => !single(type)))
	/** For the owner, what the profile could have and has none of yet */
	let toStart = $derived(startable.filter((type) => type !== app.profile))

	let params = $derived(shownUrl().searchParams)
	/** The type at hand, from the URL; none on the app's home */
	let selected = $derived([...tabs, ...startable].find((type) => type.nsid === params.get('type')))
	/** Its home: what this profile has here, a shelf per type (no type chosen) */
	let home = $derived(!selected && tabs.length > 0)
	/** Its profile's banner, atop its home */
	let banner = $derived(
		app.profile?.record && !data.repo.local
			? recordCard(app.profile.record.value, app.profile.lexicon?.defs.main?.record).banner
			: undefined
	)
	let lexicon = $derived(
		selected ? resolveLexicon(selected.nsid).catch(() => undefined) : undefined
	)
	let open = $derived(params.get('record') ?? undefined)
	let creating = $derived(owner && params.has('new'))
	let editing = $derived(owner && params.has('edit'))
	/** The list's search and filters, kept on the way to one of its records and back */
	let kept = $derived(new URLSearchParams(filterParams(params)).toString())
	const keep = (url: string) => (kept ? `${url}${url.includes('?') ? '&' : '?'}${kept}` : url)
	let base = $derived(selected ? keep(appScreenPath(actor, app.app, {type: selected.nsid})) : '')
	/** Which app and whose data, for sheets that cover the app's header on phones */
	let context = $derived(
		`${info.name}${info.name.toLowerCase() === info.domain ? '' : ` · ${info.domain}`} · @${actor}`
	)
	const at = (type: string, open: {record?: string; edit?: boolean; create?: boolean} = {}) =>
		appScreenPath(actor, app.app, {type, ...open})
</script>

{#snippet sections()}
	<!-- Its types as tabs, where the bar under the header starts -->
	{#if tabs.length}
		<nav aria-label={m.app_tabs()}>
			<ul>
				<li>
					<a href={appScreenPath(actor, app.app)} aria-current={home ? 'page' : undefined}
						>{m.app_overview()}</a
					>
				</li>
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
{/snippet}

<enform-app-screen>
	<header>
		<!-- Where one is: the app, then whose profile in it, as this app shows them -->
		<AppOwner repo={data.repo} {app} {info} />
		<!-- The app at hand: pin it; open it, read what it is, see its data, in its menu -->
		<menu>
			<li>
				<AppMenu
					{info}
					data={selected ? collectionPath(actor, selected.nsid) : dataPath(actor)}
					actor={data.repo.local ? undefined : actor}
				/>
			</li>
		</menu>
	</header>

	{#if home}
		<!-- Its home: a shelf per type it has, its first records; what one can start -->
		<enform-toolbar>{@render sections()}</enform-toolbar>
		{#if banner}
			<enform-person><img src={blobUrl(data.repo, banner)} alt="" /></enform-person>
		{/if}
		{#if owner && app.profile && !app.profile.record && app.profile.lexicon}
			<p>
				<a href={at(app.profile.nsid, {create: true})} role="button">
					{m.app_create_profile({app: info.name})}
				</a>
			</p>
		{/if}
		{#each shelves as type (type.nsid)}
			<TypeShelf
				repo={data.repo}
				{type}
				all={at(type.nsid)}
				href={(rkey) => at(type.nsid, {record: rkey})}
				add={owner && type.lexicon ? at(type.nsid, {create: true}) : undefined}
			/>
		{/each}
		{#if owner && toStart.length}
			<AppActions types={toStart} href={start} title={m.actions_title({app: info.name})} />
		{/if}
	{:else if !selected}
		<enform-toolbar>{@render sections()}</enform-toolbar>
		{#if !owner}<p>{m.app_screen_empty({app: info.name})}</p>{/if}
		<AppActions types={doable} href={start} title={m.actions_title({app: info.name})} />
		{#if !owner && !me}<p><small>{m.actions_view_only({app: info.name})}</small></p>{/if}
	{:else if single(selected)}
		<!-- One record per account: shown whole, edited from the bar -->
		{#await getRecord(data.repo, selected.nsid, selected.rkey)}
			<enform-toolbar>{@render sections()}</enform-toolbar>
			<p><small>{m.collection_loading()}</small></p>
		{:then record}
			{@const title = describeRecord(record, selected.lexicon).title}
			<enform-toolbar>{@render sections()}</enform-toolbar>
			<!-- The record, as in its sheet: its actions and how to see it on one line; its
			     fields first, as the header already shows it rendered -->
			<RecordViews
				repo={data.repo}
				{record}
				lexicon={selected.lexicon}
				collection={selected.nsid}
				initial="fields"
			>
				{#snippet actions()}
					<RecordActionsMenu
						value={record.value}
						lexicon={selected.lexicon}
						title={title ?? typeLabel(selected.nsid)}
						start={() =>
							reader.start([
								{repo: data.repo, record, lexicon: selected.lexicon, href: shownUrl().href}
							])}
					/>
					{#if owner}
						<menu>
							<RecordActions
								{actor}
								collection={selected.nsid}
								rkey={selected.rkey}
								cid={record.cid}
								editHref={at(selected.nsid, {record: selected.rkey, edit: true})}
								deleted={appScreenPath(actor, app.app)}
							/>
						</menu>
					{/if}
				{/snippet}
			</RecordViews>
		{:catch}
			<enform-toolbar>{@render sections()}</enform-toolbar>
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
		{@const type = selected}
		{#await lexicon then doc}
			<RecordGrid
				repo={data.repo}
				collection={type.nsid}
				lexicon={doc}
				href={(rkey) => keep(at(type.nsid, {record: rkey}))}
				{open}
				lead={sections}
			>
				{#snippet actions()}
					{#if start}
						<NewMenu
							current={type.lexicon ? type : undefined}
							others={makeable.filter((other) => other.nsid !== type.nsid)}
							href={start}
						/>
					{/if}
				{/snippet}
			</RecordGrid>
		{/await}
		{#if owner && selected.lexicon}
			<enform-fab>
				<a href={at(selected.nsid, {create: true})} role="button">
					+ {kindVerb(kindOf(selected.lexicon).kind, typeLabel(selected.nsid)).verb}
				</a>
			</enform-fab>
		{/if}
	{/if}

	{#if (selected || home) && !start}
		<p><small>{m.actions_view_only({app: info.name})}</small></p>
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
				close={keep(at(selected.nsid, {record: open}))}
			>
				<EditRecord
					lexicon={doc}
					{actor}
					rkey={open}
					{record}
					saved={keep(at(selected.nsid, {record: open}))}
				/>
			</RecordSheet>
		{:else}
			<RecordSheet
				title={describeRecord(record, doc).title ?? typeLabel(selected.nsid)}
				subtitle={`${typeLabel(selected.nsid)} · ${context}`}
				close={base}
				page={recordPath(actor, selected.nsid, open)}
			>
				{#if record.pending}
					<p role="status"><a href={inApp('/settings/waiting')}>{m.outbox_record_waiting()}</a></p>
				{/if}
				<!-- One bar: what one can do with it (play, read, go to what it points at; edit
				     and delete, when it's yours), then how to see it -->
				<RecordViews repo={data.repo} {record} lexicon={doc} collection={selected.nsid}>
					{#snippet actions()}
						<RecordActionsMenu
							value={record.value}
							lexicon={doc}
							title={describeRecord(record, doc).title ?? typeLabel(selected.nsid)}
							start={() =>
								reader.start([{repo: data.repo, record, lexicon: doc, href: shownUrl().href}])}
						/>
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
						{/if}
					{/snippet}
				</RecordViews>
			</RecordSheet>
		{/if}
	{:catch}
		<RecordSheet title={typeLabel(selected.nsid)} close={base}>
			<p>{m.error_not_found()}</p>
		</RecordSheet>
	{/await}
{/if}
