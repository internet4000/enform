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

export default defineConfig(({mode}) => ({
	resolve: {alias: mode === 'e2e' ? [e2eConfig] : []},
	plugins: [
		sveltekit({
			preprocess: vitePreprocess(),
			// Fully static SPA: every repo's own PDS is the backend, there is no server of ours.
			// The end-to-end build goes apart, so it is never the one deployed.
			adapter: adapterStatic({
				pages: mode === 'e2e' ? 'dist-e2e' : 'dist',
				assets: mode === 'e2e' ? 'dist-e2e' : 'dist',
				fallback: 'index.html',
				strict: true
			}),
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
