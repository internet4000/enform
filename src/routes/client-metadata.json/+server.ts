import {json} from '@sveltejs/kit'
import {clientMetadata} from '#lib/auth/metadata'

export const prerender = true

// At the instance's own address: `paths.origin` and `paths.base` when built
// (vite.config.ts), wherever it is served in dev
export const GET = ({url}) => json(clientMetadata(url))
