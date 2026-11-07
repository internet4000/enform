/**
 * The signed-in account, its granted scope, and stepping up to more permissions
 * when an action needs them.
 */
import type {OAuthSession} from '@atproto/oauth-client-browser'
import {resolveIdentity, type Identity} from '#lib/atproto/identity'
import {authorizePopup, initSession} from './client'
import {
	allowsBlob,
	allowsRepo,
	scopeForBlob,
	scopeForRepo,
	withScopes,
	type RepoAction
} from './scopes'

class Auth {
	session = $state.raw<OAuthSession>()
	scope = $state<string>()
	identity = $state<Identity>()
	ready = $state(false)

	get did() {
		return this.session?.did
	}

	async use(session: OAuthSession | undefined) {
		this.session = session
		this.scope = session ? (await session.getTokenInfo(false)).scope : undefined
		this.identity = session ? await resolveIdentity(session.did).catch(() => undefined) : undefined
	}

	canWrite(collection: string, action: RepoAction): boolean {
		return allowsRepo(this.scope, collection, action)
	}

	canUpload(mime: string): boolean {
		return allowsBlob(this.scope, mime)
	}

	/** Make sure the session allows these scopes, asking the user if not */
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

	async signOut() {
		await this.session?.signOut().catch(() => {})
		await this.use(undefined)
	}
}

export const auth = new Auth()

/** Restores the session at start; resolves with where a sign-in wanted to return to */
export async function startAuth(): Promise<string | undefined> {
	try {
		const {session, returnTo} = await initSession()
		await auth.use(session)
		return returnTo
	} finally {
		auth.ready = true
	}
}
