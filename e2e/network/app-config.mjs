/**
 * The app's config (src/lib/config/app.json) pointed at the local network, written where
 * `vite --mode e2e` reads it instead (vite.config.ts). Only services and HTTP change.
 */
import fs from 'node:fs/promises'
import path from 'node:path'
import {fileURLToPath} from 'node:url'

const root = fileURLToPath(new URL('../..', import.meta.url))

export const APP_CONFIG = path.join(root, 'src/lib/config/app.json')
export const E2E_APP_CONFIG = path.join(root, 'e2e/.network/app.json')
export const ENDPOINTS = path.join(root, 'e2e/.network/endpoints.json')

/** @param {{plc: string, pds: string, dns: string}} endpoints */
export async function writeAppConfig(endpoints) {
	const app = JSON.parse(await fs.readFile(APP_CONFIG, 'utf8'))
	const config = {
		...app,
		services: {
			...app.services,
			plcDirectory: endpoints.plc,
			handleResolver: endpoints.pds,
			dnsOverHttps: endpoints.dns
		},
		oauth: {...app.oauth, allowHttp: true}
	}
	await fs.mkdir(path.dirname(E2E_APP_CONFIG), {recursive: true})
	await fs.writeFile(E2E_APP_CONFIG, JSON.stringify(config, null, '\t') + '\n')
}

/** @param {object} endpoints */
export async function writeEndpoints(endpoints) {
	await fs.mkdir(path.dirname(ENDPOINTS), {recursive: true})
	await fs.writeFile(ENDPOINTS, JSON.stringify(endpoints, null, '\t') + '\n')
}
