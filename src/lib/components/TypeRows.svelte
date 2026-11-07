<script lang="ts">
	// Record types of an app as rows: a list opens its records, a one-record type its record;
	// for the owner, rows add to a list or edit the record
	import * as m from '#lib/paraglide/messages.js'
	import type {AppSingle, AppType} from '#lib/apps/types'
	import {collectionPath, editPath, newPath, recordPath} from '#lib/paths'

	type Props = {types: (AppType | AppSingle)[]; actor?: string; owner?: boolean; create?: boolean}
	let {types, actor, owner = false, create = false}: Props = $props()

	function single(type: AppType | AppSingle): type is AppSingle {
		return 'rkey' in type
	}
</script>

<enform-type-rows>
	<ul>
		{#each types as type (type.nsid)}
			{@const description = type.lexicon?.defs.main?.description ?? ''}
			<li>
				{#if create || !actor}
					<!-- Something to create: in a one-record type, it may already exist (then: edit) -->
					<a href={newPath(type.nsid)}>
						<span>{type.name}</span>
						<small>{description}</small>
					</a>
				{:else}
					<a
						href={single(type)
							? recordPath(actor, type.nsid, type.rkey)
							: collectionPath(actor, type.nsid)}
					>
						<span>{type.name}</span>
						<small>{description}</small>
					</a>
					{#if owner && type.lexicon}
						{#if single(type)}
							<a href={editPath(actor, type.nsid, type.rkey)}>{m.record_edit()}</a>
						{:else}
							<a
								href={newPath(type.nsid)}
								aria-label={m.collection_add_to({collection: type.nsid})}
							>
								{m.collection_add()}
							</a>
						{/if}
					{/if}
				{/if}
			</li>
		{/each}
	</ul>
</enform-type-rows>
