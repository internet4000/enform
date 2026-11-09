<script lang="ts">
	// Your handle: a name under one of your server's domains, or a domain of your own. For
	// your own, what to publish there (a DNS TXT record or a file), and whether it points
	// at you yet; saving asks for the permission to change it, the first time
	import * as m from '#lib/paraglide/messages.js'
	import {inApp, actorName} from '#lib/paths'
	import {auth} from '#lib/auth/session.svelte'
	import {handleOf, pointsAt, proofs, serverDomains} from '#lib/atproto/handle'
	import {updateHandle} from '#lib/atproto/write'
	import SettingsHeader from '#lib/components/SettingsHeader.svelte'

	let me = $derived(auth.local ? undefined : auth.identity)

	let domains = $state<string[]>([])
	$effect(() => {
		const pds = me?.pds
		if (!pds) return
		serverDomains(pds)
			.then((found) => (domains = found))
			.catch(() => (domains = []))
	})

	let own = $state(false)
	let name = $state('')
	let domain = $state<string>()
	// Your own domain when the server gives none
	let mine = $derived(own || !domains.length)
	let under = $derived(mine ? undefined : (domain ?? domains[0]))
	let handle = $derived(handleOf(name, under))
	let proof = $derived(handle && me ? proofs(handle, me.did) : undefined)

	let pending = $state(false)
	let check = $state<'you' | 'other' | 'none'>()
	let failed = $state<string>()
	let done = $state<string>()

	$effect(() => {
		void handle
		check = undefined
		failed = undefined
	})

	async function checkDomain() {
		if (!handle || !me) return
		pending = true
		check = await pointsAt(handle, me.did)
		pending = false
		return check
	}

	async function save(event: SubmitEvent) {
		event.preventDefault()
		if (!handle || !me) return
		failed = undefined
		done = undefined
		// Your own domain must point at you first: the server would refuse it anyway
		if (mine && (await checkDomain()) !== 'you') return
		pending = true
		try {
			await updateHandle(handle)
			done = handle
			name = ''
		} catch (err) {
			failed = (err as Error).message
		} finally {
			pending = false
		}
	}

	let copied = $state<string>()
	async function copy(text: string) {
		try {
			await navigator.clipboard.writeText(text)
			copied = text
		} catch {
			// Not allowed here: it can still be selected
		}
	}
</script>

{#snippet value(text: string)}
	<span><code>{text}</code></span>
	<button type="button" onclick={() => copy(text)}>
		{copied === text ? m.handle_copied() : m.handle_copy()}
	</button>
{/snippet}

<enform-page>
	<SettingsHeader title={m.handle_title()} />
	{#if !me}
		<p>{auth.ready ? m.handle_signed_out() : ''}</p>
	{:else}
		<p>
			{m.handle_current()} <strong>@{actorName(me)}</strong>
		</p>
		<enform-handle>
			<form onsubmit={save}>
				{#if domains.length}
					<label>
						<span>{m.handle_own_domain()}</span>
						<input type="checkbox" role="switch" bind:checked={own} />
					</label>
				{/if}
				<label>
					<span>{m.handle_label()}</span>
					<enform-handle-name>
						<input
							type="text"
							bind:value={name}
							placeholder={mine ? m.handle_domain_placeholder() : m.handle_name_placeholder()}
							autocapitalize="off"
							autocomplete="off"
							spellcheck="false"
							inputmode="url"
							aria-invalid={name.trim() && !handle ? 'true' : undefined}
							required
						/>
						{#if !mine}
							{#if domains.length > 1}
								<select bind:value={domain} aria-label={m.handle_domain()}>
									{#each domains as option (option)}<option value={option}>{option}</option>{/each}
								</select>
							{:else}
								<span>{under}</span>
							{/if}
						{/if}
					</enform-handle-name>
				</label>
				{#if mine && proof && handle}
					<p>{m.handle_point({domain: handle})}</p>
					<dl>
						<dt>{m.handle_dns()}</dt>
						<dd>{@render value(proof.dns.name)}</dd>
						<dt>{m.handle_dns_value()}</dt>
						<dd>{@render value(proof.dns.value)}</dd>
						<dt>{m.handle_or_file()}</dt>
						<dd>{@render value(proof.https.url)}</dd>
						<dt>{m.handle_file_value()}</dt>
						<dd>{@render value(proof.https.value)}</dd>
					</dl>
					{#if check}
						<p role="status" data-check={check}>
							{check === 'you'
								? m.handle_points_you({domain: handle})
								: check === 'other'
									? m.handle_points_other({domain: handle})
									: m.handle_points_none({domain: handle})}
						</p>
					{/if}
				{/if}
				<menu>
					<li><a href={inApp('/settings')} role="button">{m.handle_cancel()}</a></li>
					{#if mine}
						<li>
							<button type="button" disabled={!handle || pending} onclick={checkDomain}>
								{m.handle_check()}
							</button>
						</li>
					{/if}
					<li>
						<button
							type="submit"
							disabled={!handle || pending || handle === me.handle}
							aria-busy={pending}
						>
							{m.handle_save()}
						</button>
					</li>
				</menu>
			</form>
			{#if failed}<p role="alert">{failed}</p>{/if}
			{#if done}<p role="status">{m.handle_done({handle: `@${done}`})}</p>{/if}
		</enform-handle>
		<p><small>{m.handle_hint()}</small></p>
	{/if}
</enform-page>
