<script lang="ts">
	// What one can make in an app, where one is: the type at hand first (+ New post), the
	// app's other types in a menu beside it, each with its kind's verb, from its lexicon
	import * as m from '#lib/paraglide/messages.js'
	import {typeLabel} from '#lib/apps/directory'
	import type {AppType} from '#lib/apps/types'
	import {kindOf} from '#lib/records/kinds'
	import {kindVerb} from '#lib/records/kind-words'

	type Props = {
		/** The type at hand, made with one tap */
		current?: AppType
		/** The app's other types one can make */
		others: AppType[]
		href: (type: string) => string
	}
	let {current, others, href}: Props = $props()
	const id = $props.id()

	const verb = (type: AppType) => kindVerb(kindOf(type.lexicon).kind, typeLabel(type.nsid))
</script>

{#if current}
	<li>
		<enform-new>
			<a href={href(current.nsid)} role="button">+ {verb(current).verb}</a>
		</enform-new>
	</li>
{/if}
{#if others.length}
	<li>
		<button
			type="button"
			popovertarget="{id}-new"
			aria-label={current ? m.app_new_other() : undefined}
			title={current ? m.app_new_other() : undefined}
		>
			{current ? '+ …' : `+ ${m.app_new_menu()}`}
		</button>
		<enform-menu id="{id}-new" popover="auto">
			<ul>
				{#each others as type (type.nsid)}
					{@const words = verb(type)}
					<li>
						<a href={href(type.nsid)}
							>{words.verb}{#if !words.named}<small>{typeLabel(type.nsid)}</small>{/if}</a
						>
					</li>
				{/each}
			</ul>
		</enform-menu>
	</li>
{/if}
