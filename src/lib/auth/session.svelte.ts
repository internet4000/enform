/**
 * The signed-in accounts: the current one, its granted scope, and stepping up to more
 * permissions when an action needs them; the others, to switch to.
 */
import type {OAuthSession} from '@atproto/oauth-client-browser'
import {invalidateAll} from '$app/navigation'
import {resolveIdentity, type Identity} from '#lib/atproto/identity'
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

	get did() {
		return this.session?.did
	}

	/** Makes this session the current one */
	async use(session: OAuthSession | undefined) {
		const scope = session ? (await session.getTokenInfo(false)).scope : undefined
		this.session = session
		this.scope = scope
		this.identity = undefined
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
		if (this.session?.did === did) return
		await this.use(await restoreSession(did))
		await invalidateAll()
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
		if (next) await this.switchTo(next).catch(() => invalidateAll())
		else await invalidateAll()
	}

	canWrite(collection: string, action: RepoAction): boolean {
		return allowsRepo(this.scope, collection, action)
	}

	canUpload(mime: string): boolean {
		return allowsBlob(this.scope, mime)
	}

	/** Make sure the current account's session allows these scopes, asking the user if not */
	async authorize(needed: string[]): Promise<OAuthSession> {
		if (!this.session) throw new Error('Not signed in')
		await this.use(await authorizePopup(this.session.did, withScopes(this.scope, needed)))
		return this.session
	}

	async authorizeRepo(collection: string, action: RepoAction): Promise<OAuthSession> {
		if (this.session && this.canWrite(collection, action)) return this.session
		return this.authorize([scopeForRepo(collection, action)])
	}

	async authorizeBlob(mime: string): Promise<OAuthSession> {
		if (this.session && this.canUpload(mime)) return this.session
		return this.authorize([scopeForBlob(mime)])
	}
}

export const auth = new Auth()

onSessionDeleted((did) => void auth.forget(did))

/** Restores the last used account at start; resolves with where a sign-in wanted to return to */
export async function startAuth(): Promise<string | undefined> {
	try {
		auth.list(loadAccounts())
		const {session, returnTo} = await initSession()
		await auth.use(session)
		return returnTo
	} finally {
		auth.ready = true
	}
}
