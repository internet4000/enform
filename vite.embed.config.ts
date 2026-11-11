/**
 * The embed (docs/embed.md): <enform-embed>, one ES module, `enform-embed.js`, next to
 * the app's build (built after it). enform's components, without SvelteKit: its paths
 * link to an enform instance, and no one is signed in (src/embed/*.ts stand in).
 */
import {fileURLToPath} from 'node:url'
import {defineConfig} from 'vite'
import {svelte, vitePreprocess} from '@sveltejs/vite-plugin-svelte'
import app from './src/lib/config/app.json' with {type: 'json'}

const here = (path: string) => fileURLToPath(new URL(path, import.meta.url))

/** The instance it links to, as the app's build names itself (docs/self-host.md) */
const ORIGIN = process.env.ORIGIN || `https://${app.domain}`
const BASE_PATH = (process.env.BASE_PATH ?? '').replace(/\/$/, '')

export default defineConfig(({mode}) => ({
	define: {__ENFORM__: JSON.stringify(`${ORIGIN}${BASE_PATH}/`)},
	resolve: {
		alias: [
			// `--mode e2e`: pointed at the local test network, as the app's e2e build is
			...(mode === 'e2e'
				? [{find: /^#lib\/config\/app\.json$/, replacement: here('e2e/.network/app.json')}]
				: []),
			{find: /^#lib\/auth\/session\.svelte$/, replacement: here('src/embed/session.ts')},
			{find: /^#lib\/(.*)$/, replacement: here('src/lib/$1')},
			{find: '$app/paths', replacement: here('src/embed/paths.ts')},
			{find: '$app/navigation', replacement: here('src/embed/navigation.ts')},
			{find: '$app/state', replacement: here('src/embed/state.ts')}
		]
	},
	plugins: [svelte({preprocess: vitePreprocess(), compilerOptions: {css: 'injected'}})],
	build: {
		target: 'esnext',
		outDir: mode === 'e2e' ? 'dist-e2e' : 'dist',
		emptyOutDir: false,
		copyPublicDir: false,
		// One file to copy, minified (Vite leaves a library's ES module unminified): the
		// media players it loads when needed, in it
		rolldownOptions: {output: {codeSplitting: false, minify: true}},
		lib: {
			entry: here('src/embed/index.ts'),
			formats: ['es'],
			fileName: () => 'enform-embed.js'
		}
	}
}))
