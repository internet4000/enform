<script lang="ts">
	// Every account on this browser in one list, as Bluesky's switcher: those on their
	// server and those on this device, each saying where its records are kept; the one
	// you act as marked, the others to switch to. Then adding one, either way. What is
	// made on this device stays on it: never published to an account.
	import * as m from '#lib/paraglide/messages.js'
	import {goto} from '$app/navigation'
	import {auth} from '#lib/auth/session.svelte'
	import {profileAvatar} from '#lib/atproto/profile'
	import {localIdentity} from '#lib/atproto/identity'
	import {createProfile, listProfiles, removeProfile, type LocalProfile} from '#lib/local/store'
	import {actorName, inApp, repoPath} from '#lib/paths'
	import SignIn from './SignIn.svelte'

	let profiles = $state<LocalProfile[]>([])
	let name = $state('')
	let busy = $state<string>()
	let failed = $state<string>()

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

	/** Removing one on this device asks first, in a native dialog */
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

{#snippet item(
	key: string,
	actor: string,
	label: string,
	where: string | undefined,
	current: boolean,
	avatar: Promise<string | undefined> | undefined,
	use: () => Promise<void>,
	leave: {label: string; aria: string; onclick: () => void}
)}
	<li>
		<enform-account-item current={current || undefined} busy={busy === key || undefined}>
			<enform-avatar>
				{#await avatar then src}
					{#if src}<img {src} alt="" loading="lazy" />{:else}{label
							.replace(/^@/, '')
							.charAt(0)
							.toUpperCase()}{/if}
				{/await}
			</enform-avatar>
			<a href={repoPath(actor)} aria-current={current || undefined}>
				{label}
				{#if where}<small>{where}</small>{/if}
			</a>
			{#if current}
				<small>{m.accounts_current()}</small>
			{:else}
				<button
					type="button"
					disabled={!!busy}
					aria-label={m.accounts_switch_to({actor})}
					onclick={() => run(key, use)}
				>
					{m.accounts_switch()}
				</button>
			{/if}
			<button type="button" disabled={!!busy} aria-label={leave.aria} onclick={leave.onclick}>
				{leave.label}
			</button>
		</enform-account-item>
	</li>
{/snippet}

<enform-accounts>
	{#if auth.accounts.length || profiles.length}
		<ul>
			{#each auth.accounts as account (account.did)}
				{@const actor = account.identity ? actorName(account.identity) : account.did}
				{@render item(
					account.did,
					actor,
					`@${actor}`,
					account.identity?.pds ? new URL(account.identity.pds).host : undefined,
					!auth.local && account.did === auth.did,
					account.identity ? profileAvatar(account.identity) : undefined,
					() => auth.switchTo(account.did),
					{
						label: m.session_sign_out(),
						aria: m.accounts_sign_out_of({actor}),
						onclick: () => run(account.did, () => auth.signOut(account.did))
					}
				)}
			{/each}
			{#each profiles as profile (profile.id)}
				{@const actor = actorName(localIdentity(profile))}
				{@render item(
					profile.id,
					actor,
					profile.name,
					`@${actor} · ${m.accounts_on_device()}`,
					auth.local?.id === profile.id,
					undefined,
					() => auth.useLocal(profile),
					{
						label: m.local_remove(),
						aria: `${m.local_remove()} ${profile.name}`,
						onclick: () => ask(profile)
					}
				)}
			{/each}
		</ul>
	{/if}
	{#if failed}<p role="alert">{failed}</p>{/if}

	<section aria-labelledby="add-account">
		<h2 id="add-account">{m.accounts_add()}</h2>
		{#if auth.ready}
			<SignIn returnTo={inApp('/settings/accounts')} adding={!!auth.session} />
		{/if}
	</section>

	<section aria-labelledby="new-on-device">
		<h2 id="new-on-device">{m.local_new()}</h2>
		<p><small>{m.local_intro()}</small></p>
		<form onsubmit={create}>
			<label>
				{m.local_name_label()}
				<input type="text" bind:value={name} placeholder={m.local_default_name()} />
			</label>
			<button type="submit" disabled={busy === 'new'}>{m.local_create()}</button>
		</form>
	</section>

	<dialog bind:this={dialog} aria-labelledby="remove-local-title" data-danger>
		<h2 id="remove-local-title">{m.local_remove()}</h2>
		<p>{m.local_remove_confirm({name: removing?.name ?? ''})}</p>
		<form onsubmit={remove}>
			<button type="button" onclick={() => dialog?.close()}>{m.action_cancel()}</button>
			<button type="submit">{m.local_remove()}</button>
		</form>
	</dialog>
</enform-accounts>
