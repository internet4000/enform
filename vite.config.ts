import {sveltekit} from '@sveltejs/kit/vite'
import {vitePreprocess} from '@sveltejs/vite-plugin-svelte'
import adapterStatic from '@sveltejs/adapter-static'
import {defineConfig} from 'vitest/config'
import {paraglideVitePlugin} from '@inlang/paraglide-js'

export default defineConfig({
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
})
