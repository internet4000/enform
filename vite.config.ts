import {copyFileSync, writeFileSync} from 'node:fs'
import {fileURLToPath} from 'node:url'
import {sveltekit} from '@sveltejs/kit/vite'
import {vitePreprocess} from '@sveltejs/vite-plugin-svelte'
import adapterStatic from '@sveltejs/adapter-static'
import {defineConfig} from 'vitest/config'
import {paraglideVitePlugin} from '@inlang/paraglide-js'
import app from './src/lib/config/app.json' with {type: 'json'}

/** CSP host sources from config (JSON gives plain strings) */
const hosts = (list: string[]) => list as `https://${string}.${string}`[]

// `--mode e2e`: the app's config pointed at the local test network (written by e2e/network.mjs)
const e2eConfig = {
	find: /^#lib\/config\/app\.json$/,
	replacement: fileURLToPath(new URL('e2e/.network/app.json', import.meta.url))
}

/**
 * Where an instance is served, set when building it (docs/self-host.md): its origin and
 * the folder it lives in, if any. They make its address, and so its OAuth client ID.
 */
const ORIGIN = process.env.ORIGIN || `https://${app.domain}`
const BASE_PATH = (process.env.BASE_PATH ?? '').replace(/\/$/, '') as '' | `/${string}`

/**
 * adapter-static, plus the fallbacks static hosts look for, so any page opens at its
 * URL: `404.html` (GitHub Pages and most hosts) and `_redirects` (GitLab Pages, Netlify,
 * Cloudflare Pages) serving the app for every path.
 */
function staticHost(options: Parameters<typeof adapterStatic>[0] & {pages: string}) {
	const adapter = adapterStatic(options)
	return {
		...adapter,
		async adapt(builder: Parameters<typeof adapter.adapt>[0]) {
			await adapter.adapt(builder)
			copyFileSync(`${options.pages}/index.html`, `${options.pages}/404.html`)
			writeFileSync(`${options.pages}/_redirects`, `${BASE_PATH}/* ${BASE_PATH}/index.html 200\n`)
		}
	}
}

export default defineConfig(({mode, command}) => ({
	resolve: {alias: mode === 'e2e' ? [e2eConfig] : []},
	plugins: [
		sveltekit({
			preprocess: vitePreprocess(),
			// Fully static SPA: every repo's own PDS is the backend, there is no server of ours.
			// The end-to-end build goes apart, so it is never the one deployed.
			adapter: staticHost({
				pages: mode === 'e2e' ? 'dist-e2e' : 'dist',
				assets: mode === 'e2e' ? 'dist-e2e' : 'dist',
				fallback: 'index.html',
				strict: true
			}),
			paths: {
				// Unit tests check the app's paths at the root, wherever it is built for
				base: mode === 'test' ? '' : BASE_PATH,
				// The built metadata names the instance; in dev it follows whatever serves it
				...(command === 'build' ? {origin: ORIGIN} : {})
			},
			// Content Security Policy as a meta tag, with hashes of Kit's inline scripts:
			// scripts only from enform and the media providers' players, frames only from
			// them, connections to any HTTPS host (repos live anywhere; the local test
			// network over http in e2e mode)
			csp: {
				mode: 'hash',
				directives: {
					'default-src': ['self'],
					'script-src': ['self', ...hosts(app.csp.scripts)],
					'frame-src': hosts(app.csp.frames),
					'connect-src': [
						'self',
						'https:',
						'wss:',
						...(mode === 'e2e' ? (['http://localhost:*'] as const) : [])
					],
					'img-src': ['self', 'https:', 'data:', 'blob:'],
					'media-src': ['self', 'https:', 'blob:'],
					'style-src': ['self', 'unsafe-inline'],
					'worker-src': ['self', 'blob:'],
					'object-src': ['none'],
					'base-uri': ['self']
				}
			}
		}),
		paraglideVitePlugin({
			project: './i18n/project.inlang',
			outdir: './src/lib/paraglide',
			strategy: ['localStorage', 'preferredLanguage', 'baseLocale']
		})
	],
	server: {
		// atproto OAuth loopback clients must use 127.0.0.1, not localhost
		host: '127.0.0.1'
	},
	build: {
		target: 'esnext'
	},
	test: {
		environment: 'happy-dom',
		include: ['src/**/*.test.ts'],
		reporters: ['dot']
	}
}))
