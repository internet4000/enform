/** enform's OAuth client metadata (https://atproto.com/specs/oauth#clients) */
import app from '#lib/config/app.json' with {type: 'json'}

export const CLIENT_METADATA_PATH = '/client-metadata.json'

import {DECLARED_SCOPES} from './scopes'

/** The production origin */
export const APP_ORIGIN = `https://${app.domain}`

/**
 * Everything enform may ever ask for. Each authorization asks for a small part of it:
 * `atproto` to sign in, then what each write needs (scopes.ts).
 */
export const CLIENT_SCOPE = DECLARED_SCOPES.join(' ')

export function clientMetadata(origin: string) {
	return {
		client_id: `${origin}${CLIENT_METADATA_PATH}`,
		client_name: app.name,
		client_uri: origin,
		logo_uri: `${origin}${app.logo}`,
		redirect_uris: [`${origin}/`],
		scope: CLIENT_SCOPE,
		grant_types: ['authorization_code', 'refresh_token'],
		response_types: ['code'],
		application_type: 'web',
		token_endpoint_auth_method: 'none',
		dpop_bound_access_tokens: true
	}
}
