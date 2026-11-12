/**
 * The signed-in accounts: the current one, its granted scope, and stepping up to more
 * permissions when an action needs them; the others, to switch to.
 */
import type {OAuthSession} from '@atproto/oauth-client-browser'
import {refreshAll} from '$app/navigation'
import {localIdentity, resolveIdentity, type Identity} from '#lib/atproto/identity'
import {getProfile, type LocalProfile} from '#lib/local/store'
import app from '#lib/config/app.json' with {type: 'json'}
import {loadAccounts, nextAccount, saveAccounts, withAccount, withoutAccount} from './accounts'
import {
	authorizePopup,
	initSession,
	onSessionDeleted,
	restoreSession,
	revokeSession,
	signInRedirect
} from './client'
import {
	actionsFor,
	allowsBlob,
	allowsRepo,
	scopeForBlob,
	scopeForRepo,
	withScopes,
	type RepoAction
} from './scopes'

export type Account = {did: string; identity?: Identity}

class Auth {
	session = $state.raw<OAuthSession>()
	scope = $state<string>()
	identity = $state<Identity>()
	/** Every account signed in on this browser, the current one included */
	accounts = $state.raw<Account[]>([])
	ready = $state(false)
	/** The local profile you act as, instead of the current account, when set */
	local = $state.raw<LocalProfile>()

	get did() {
		return this.session?.did
	}

	/** Who you are acting as: the current local profile, else the current account */
	get me(): Identity | undefined {
		return this.local ? localIdentity(this.local) : this.identity
	}

	/** Whether this repo is yours to write to, as who you are acting as */
	owns(repo: {did: string}): boolean {
		return !!this.me && this.me.did === repo.did
	}

	/** Acts as this local profile (or, with none, as the current account again) */
	async useLocal(profile: LocalProfile | undefined) {
		this.local = profile
		try {
			if (profile) localStorage.setItem(app.storage.local, profile.id)
			else localStorage.removeItem(app.storage.local)
		} catch {
			// Storage blocked: it's only remembering the choice
		}
		await refreshAll()
	}

	/** Makes this session the current one */
	async use(session: OAuthSession | undefined) {
		const scope = session ? (await session.getTokenInfo(false)).scope : undefined
		// A new authorization for the same account (more permissions) keeps who it is:
		// clearing it would unmount, and empty, the form that asked
		const same = !!session && this.identity?.did === session.did
		this.session = session
		this.scope = scope
		if (!same) this.identity = undefined
		if (!session) return
		this.list(withAccount(this.#dids, session.did))
		const identity = await resolveIdentity(session.did).catch(() => undefined)
		if (this.session === session) this.identity = identity
	}

	get #dids() {
		return this.accounts.map((account) => account.did)
	}

	/** Lists these accounts, resolving the handles not known yet */
	list(dids: string[]) {
		const known = new Map(this.accounts.map((account) => [account.did, account]))
		this.accounts = dids.map((did) => known.get(did) ?? {did})
		saveAccounts(dids)
		for (const {did, identity} of this.accounts) {
			if (identity) continue
			resolveIdentity(did)
				.then((found) => {
					this.accounts = this.accounts.map((account) =>
						account.did === did ? {did, identity: found} : account
					)
				})
				.catch(() => {})
		}
	}

	async switchTo(did: string) {
		if (this.local) await this.useLocal(undefined)
		if (this.session?.did === did) return
		await this.use(await restoreSession(did))
		await refreshAll()
	}

	/** Signs in another account, through its server, with identity only */
	async addAccount(handle: string, returnTo = location.pathname + location.search) {
		await signInRedirect(handle, returnTo)
	}

	/** Signs one account out (the current one by default), then uses another if any */
	async signOut(did: string | undefined = this.did) {
		if (!did) return
		const current = this.session
		await revokeSession(did).catch(() => {})
		// Revoking makes the library forget which account was last used: keep the current one
		if (current && current.did !== did) await restoreSession(current.did).catch(() => {})
		await this.forget(did)
	}

	/** An account whose session is gone: off the list, and switch away if it was current */
	async forget(did: string) {
		const next = nextAccount(this.#dids, did)
		this.list(withoutAccount(this.#dids, did))
		if (this.session?.did !== did) return
		await this.use(undefined)
		if (next) await this.switchTo(next).catch(() => refreshAll())
		else await refreshAll()
	}

	/** Whether this write is allowed: every permission the PDS checks for it */
	canWrite(collection: string, action: RepoAction): boolean {
		return actionsFor(action).every((each) => allowsRepo(this.scope, collection, each))
	}

	canUpload(mime: string): boolean {
		return allowsBlob(this.scope, mime)
	}

	/** Make sure the current account's session allows these scopes, asking the user if not */
	async authorize(needed: string[]): Promise<OAuthSession> {
		if (!this.session) throw new Error('Not signed in')
		const did = this.session.did
		this.reauthorizing.add(did)
		try {
			await this.use(await authorizePopup(did, withScopes(this.scope, needed)))
		} finally {
			// The library revokes the replaced session as the new one arrives; its
			// deletion may be announced a moment after, from the popup's tab
			setTimeout(() => this.reauthorizing.delete(did), 2000)
		}
		return this.session
	}

	/**
	 * Accounts being authorized again (more permissions): the library revokes their
	 * previous session then, which isn't a sign-out
	 */
	reauthorizing = new Set<string>()

	async authorizeRepo(collection: string, action: RepoAction): Promise<OAuthSession> {
		if (this.session && this.canWrite(collection, action)) return this.session
		const missing = actionsFor(action).filter((each) => !allowsRepo(this.scope, collection, each))
		return this.authorize(missing.map((each) => scopeForRepo(collection, each)))
	}

	async authorizeBlob(mime: string): Promise<OAuthSession> {
		if (this.session && this.canUpload(mime)) return this.session
		return this.authorize([scopeForBlob(mime)])
	}
}

export const auth = new Auth()

onSessionDeleted((did) => {
	if (!auth.reauthorizing.has(did)) void auth.forget(did)
})

/** Restores the last used account at start; resolves with where a sign-in wanted to return to */
export async function startAuth(): Promise<string | undefined> {
	try {
		auth.list(loadAccounts())
		auth.local = await restoreLocal()
		const {session, returnTo} = await initSession()
		await auth.use(session)
		return returnTo
	} finally {
		auth.ready = true
	}
}

/** The local profile acted as last time, if any */
async function restoreLocal(): Promise<LocalProfile | undefined> {
	try {
		const id = localStorage.getItem(app.storage.local)
		return id ? await getProfile(id) : undefined
	} catch {
		return undefined
	}
}
