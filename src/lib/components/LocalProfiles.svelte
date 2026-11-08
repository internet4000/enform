<script lang="ts">
	// Local profiles: repos in this browser only, to try apps without an account. Act as
	// one, create one, publish one to your account, or remove it.
	import * as m from '#lib/paraglide/messages.js'
	import {goto} from '$app/navigation'
	import {auth} from '#lib/auth/session.svelte'
	import {localIdentity} from '#lib/atproto/identity'
	import {publishProfile, type Published} from '#lib/local/publish'
	import {createProfile, listProfiles, removeProfile, type LocalProfile} from '#lib/local/store'
	import {actorName, repoPath} from '#lib/paths'

	let profiles = $state<LocalProfile[]>([])
	let name = $state('')
	let busy = $state<string>()
	let failed = $state<string>()
	let published = $state<{id: string; result: Published}>()

	async function load() {
		profiles = await listProfiles().catch(() => [])
	}
	load()

	async function run(id: string, action: () => Promise<void>) {
		busy = id
		failed = undefined
		try {
			await action()
		} catch (err) {
			failed = (err as Error).message
		} finally {
			busy = undefined
		}
	}

	async function create(event: SubmitEvent) {
		event.preventDefault()
		await run('new', async () => {
			const profile = await createProfile(name.trim() || m.local_default_name())
			name = ''
			await load()
			await auth.useLocal(profile)
			await goto(repoPath(actorName(localIdentity(profile))))
		})
	}

	const publish = (profile: LocalProfile) =>
		run(profile.id, async () => {
			if (!auth.identity) return
			published = {id: profile.id, result: await publishProfile(profile.id, auth.identity)}
		})

	/** Removing asks first, in a native dialog */
	let removing = $state<LocalProfile>()
	let dialog = $state<HTMLDialogElement>()

	function ask(profile: LocalProfile) {
		removing = profile
		dialog?.showModal()
	}

	async function remove(event: SubmitEvent) {
		event.preventDefault()
		const profile = removing
		dialog?.close()
		if (!profile) return
		await run(profile.id, async () => {
			if (auth.local?.id === profile.id) await auth.useLocal(undefined)
			await removeProfile(profile.id)
			await load()
		})
	}
</script>

<enform-accounts local>
	<p><small>{m.local_intro()}</small></p>
	{#if profiles.length}
		<ul>
			{#each profiles as profile (profile.id)}
				{@const current = auth.local?.id === profile.id}
				<li>
					<enform-account-item
						current={current || undefined}
						busy={busy === profile.id || undefined}
					>
						<a href={repoPath(actorName(localIdentity(profile)))}>{profile.name}</a>
						<small>{current ? m.accounts_current() : m.local_on_device()}</small>
						{#if !current}
							<button type="button" onclick={() => run(profile.id, () => auth.useLocal(profile))}>
								{m.local_use()}
							</button>
						{/if}
						{#if auth.identity}
							<button type="button" onclick={() => publish(profile)}>
								{m.local_publish({handle: `@${auth.identity.handle ?? auth.identity.did}`})}
							</button>
						{/if}
						<button type="button" onclick={() => ask(profile)}>{m.local_remove()}</button>
					</enform-account-item>
					{#if published?.id === profile.id}
						<p role="status">
							{m.local_published({count: String(published.result.created)})}
							{#if published.result.skipped.length}
								{m.local_published_skipped({records: published.result.skipped.join(', ')})}
							{/if}
							{#if published.result.invalid.length}
								{m.local_published_invalid({records: published.result.invalid.join(', ')})}
							{/if}
						</p>
					{/if}
				</li>
			{/each}
		</ul>
	{/if}
	{#if auth.local}
		<p>
			<button type="button" onclick={() => auth.useLocal(undefined)}>{m.local_stop()}</button>
		</p>
	{/if}
	<form onsubmit={create}>
		<label>
			{m.local_name_label()}
			<input type="text" bind:value={name} placeholder={m.local_default_name()} />
		</label>
		<button type="submit" disabled={busy === 'new'}>{m.local_create()}</button>
	</form>
	{#if failed}<p role="alert">{failed}</p>{/if}
	<dialog bind:this={dialog} aria-labelledby="remove-local-title" data-danger>
		<h2 id="remove-local-title">{m.local_remove()}</h2>
		<p>{m.local_remove_confirm({name: removing?.name ?? ''})}</p>
		<form onsubmit={remove}>
			<button type="button" onclick={() => dialog?.close()}>{m.action_cancel()}</button>
			<button type="submit">{m.local_remove()}</button>
		</form>
	</dialog>
</enform-accounts>
