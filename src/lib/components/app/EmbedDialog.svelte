<script lang="ts">
	// How to show this profile's home in an app on any web page (docs/embed.md): the
	// snippet for it, ready to copy, loading the embed from npm (through a CDN) at its
	// current version; on another public instance than enform's, its links go back there
	import * as m from '#lib/paraglide/messages.js'
	import app from '#lib/config/app.json' with {type: 'json'}
	import embed from '../../../../packages/enform/package.json' with {type: 'json'}
	import {inApp} from '#lib/paths'

	type Props = {actor: string; domain: string; name: string}
	let {actor, domain, name}: Props = $props()

	let dialog = $state<HTMLDialogElement>()
	let copied = $state(false)

	export function open() {
		copied = false
		dialog?.showModal()
	}

	/** This instance, when it isn't the one the published embed links to, and others can
	    open it: not a local one (a dev server), whose links would lead visitors nowhere */
	let instance = $derived.by(() => {
		const here = new URL(inApp('/'), location.href)
		const local = ['localhost', '127.0.0.1', '[::1]'].includes(here.hostname)
		return local || here.href === `https://${app.domain}/` ? undefined : here.href
	})
	let snippet = $derived(
		[
			`<enform-embed actor="${actor}" app="${domain}"${instance ? ` enform="${instance}"` : ''}></enform-embed>`,
			`<script type="module" src="https://cdn.jsdelivr.net/npm/${embed.name}@${embed.version}"></` +
				'script>'
		].join('\n')
	)

	async function copy() {
		await navigator.clipboard.writeText(snippet)
		copied = true
	}
</script>

<dialog bind:this={dialog} aria-labelledby="embed-title">
	<h2 id="embed-title">{m.embed_title()}</h2>
	<p>{m.embed_intro({actor: `@${actor}`, app: name})}</p>
	<pre><code>{snippet}</code></pre>
	<p>
		<small
			><a href={`${app.source}/blob/main/docs/embed.md`} rel="noopener external" target="_blank"
				>{m.embed_how()} ↗</a
			></small
		>
	</p>
	<form method="dialog">
		<button type="submit">{m.sheet_close()}</button>
		<button type="button" onclick={copy} aria-live="polite"
			>{copied ? m.embed_copied() : m.embed_copy()}</button
		>
	</form>
</dialog>
