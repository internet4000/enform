/**
 * atproto OAuth in the browser, on @atproto/oauth-client-browser's defaults. Over
 * HTTPS the app publishes its client metadata; plain-HTTP dev uses a loopback client.
 */
import {BrowserOAuthClient, type OAuthSession} from '@atproto/oauth-client-browser'
import {buildAtprotoLoopbackClientId} from '@atproto/oauth-types'
import app from '#lib/config/app.json' with {type: 'json'}
import {CLIENT_METADATA_PATH, CLIENT_SCOPE} from './metadata'
import {BASE_SCOPE} from './scopes'

let client: Promise<BrowserOAuthClient> | undefined

function clientId(): string {
	const {protocol, origin, port} = window.location
	if (protocol === 'https:') return `${origin}${CLIENT_METADATA_PATH}`
	return buildAtprotoLoopbackClientId({
		scope: CLIENT_SCOPE,
		redirect_uris: [`http://127.0.0.1${port ? `:${port}` : ''}/`]
	})
}

export function oauthClient(): Promise<BrowserOAuthClient> {
	client ??= BrowserOAuthClient.load({
		clientId: clientId(),
		handleResolver: app.services.handleResolver
	})
	return client
}

/** Completes a sign-in callback or restores the last session; `returnTo` from its state */
export async function initSession(): Promise<{session?: OAuthSession; returnTo?: string}> {
	const result = await (await oauthClient()).init()
	return {
		session: result?.session,
		returnTo: result && 'state' in result ? (result.state ?? undefined) : undefined
	}
}

/** Redirects to the account's server to sign in with identity only */
export async function signInRedirect(handle: string, returnTo: string) {
	await (await oauthClient()).signInRedirect(handle, {scope: BASE_SCOPE, state: returnTo})
}

/** Asks for more permissions in a popup, so the page (and any form on it) stays */
export async function authorizePopup(did: string, scope: string): Promise<OAuthSession> {
	return (await oauthClient()).signInPopup(did, {scope})
}
