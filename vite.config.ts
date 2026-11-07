import {fileURLToPath} from 'node:url'
import {sveltekit} from '@sveltejs/kit/vite'
import {vitePreprocess} from '@sveltejs/vite-plugin-svelte'
import adapterStatic from '@sveltejs/adapter-static'
import {defineConfig} from 'vitest/config'
import {paraglideVitePlugin} from '@inlang/paraglide-js'

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
			adapter: adapterStatic({pages: 'dist', assets: 'dist', fallback: 'index.html', strict: true})
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
