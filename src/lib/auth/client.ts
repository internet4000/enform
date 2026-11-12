/**
 * atproto OAuth in the browser, on @atproto/oauth-client-browser's defaults. Over
 * HTTPS the app publishes its client metadata; plain-HTTP dev uses a loopback client.
 * The library keeps one session per account (DID) and remembers the last one used.
 */
import {BrowserOAuthClient, type OAuthSession} from '@atproto/oauth-client-browser'
import {buildAtprotoLoopbackClientId} from '@atproto/oauth-types'
import app from '#lib/config/app.json' with {type: 'json'}
import {CLIENT_METADATA, CLIENT_SCOPE} from './metadata'
import {BASE_SCOPE} from './scopes'
import {markPopup} from './popup'

let client: Promise<BrowserOAuthClient> | undefined

const deletedListeners = new Set<(did: string) => void>()

/** The app's page (its address is after `#`), where sign-ins come back */
const home = () => new URL('./', location.href)

function clientId(): string {
	if (location.protocol === 'https:') return new URL(CLIENT_METADATA, home()).href
	const {port, pathname} = home()
	return buildAtprotoLoopbackClientId({
		scope: CLIENT_SCOPE,
		redirect_uris: [`http://127.0.0.1${port ? `:${port}` : ''}${pathname}`]
	})
}

export function oauthClient(): Promise<BrowserOAuthClient> {
	client ??= BrowserOAuthClient.load({
		clientId: clientId(),
		handleResolver: app.services.handleResolver,
		plcDirectoryUrl: app.services.plcDirectory,
		// Authorization servers and PDSes over plain HTTP: only a local test network's
		allowHttp: app.oauth.allowHttp,
		// In the query: the fragment is the app's address (hash routing)
		responseMode: 'query',
		// Signed out, revoked or expired, here or in another tab
		onSessionDeleted: (did) => deletedListeners.forEach((listener) => listener(did))
	})
	return client
}

/** Called whenever an account's session is gone, whichever tab it was in */
export function onSessionDeleted(listener: (did: string) => void) {
	deletedListeners.add(listener)
}

/**
 * Completes a sign-in callback or restores the last session; `signedIn` when it was a
 * sign-in that just came back, `returnTo` from its state
 */
export async function initSession(): Promise<{
	session?: OAuthSession
	signedIn: boolean
	returnTo?: string
}> {
	const result = await (await oauthClient()).init()
	const callback = !!result && 'state' in result
	return {
		session: result?.session,
		signedIn: callback && !!result?.session,
		returnTo: callback ? (result.state ?? undefined) : undefined
	}
}

/** Redirects to the account's server to sign in with identity only */
export async function signInRedirect(handle: string, returnTo: string) {
	await (await oauthClient()).signInRedirect(handle, {scope: BASE_SCOPE, state: returnTo})
}

/** An account's stored session, which becomes the last used one */
export async function restoreSession(did: string): Promise<OAuthSession> {
	return (await oauthClient()).restore(did)
}

/** Revokes an account's session on its server and forgets it */
export async function revokeSession(did: string) {
	await (await oauthClient()).revoke(did)
}

/** Asks for more permissions in a popup, so the page (and any form on it) stays */
export async function authorizePopup(did: string, scope: string): Promise<OAuthSession> {
	const unmark = markPopup()
	try {
		return await (await oauthClient()).signInPopup(did, {scope})
	} finally {
		unmark()
	}
}

/**
 * In the popup: hands its answer to the page that asked, which closes it. Resolves
 * when handed over, else with why it couldn't be (its state unknown or expired…)
 */
export async function finishPopup(): Promise<string | undefined> {
	try {
		await (await oauthClient()).init()
		return undefined
	} catch (err) {
		return (err as {code?: string})?.code === 'LOGIN_CONTINUED_IN_PARENT_WINDOW'
			? undefined
			: String((err as Error)?.message ?? err)
	}
}
