/** enform's OAuth client metadata (https://atproto.com/specs/oauth#clients) */
import {resolve} from '$app/paths'
import app from '#lib/config/app.json' with {type: 'json'}
import {DECLARED_SCOPES} from './scopes'

/**
 * Where an instance publishes its client metadata, under the folder it is served from.
 * Its full URL is the instance's client ID: each instance is its own client.
 */
export const clientMetadataPath = () => resolve('client-metadata.json')

/**
 * Everything enform may ever ask for. Each authorization asks for a small part of it:
 * `atproto` to sign in, then what each write needs (scopes.ts).
 */
export const CLIENT_SCOPE = DECLARED_SCOPES.join(' ')

/** The metadata of the instance whose metadata is published at `url` (its client ID) */
export function clientMetadata(url: URL) {
	const home = new URL('./', url).href
	return {
		client_id: url.href,
		client_name: app.name,
		client_uri: home,
		logo_uri: new URL(app.logo.replace(/^\//, ''), home).href,
		redirect_uris: [home],
		scope: CLIENT_SCOPE,
		grant_types: ['authorization_code', 'refresh_token'],
		response_types: ['code'],
		application_type: 'web',
		token_endpoint_auth_method: 'none',
		dpop_bound_access_tokens: true
	}
}
