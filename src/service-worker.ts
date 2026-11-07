/// <reference types="@sveltejs/kit" />
/// <reference no-default-lib="true"/>
/// <reference lib="esnext" />
/// <reference lib="webworker" />
/**
 * The app itself, kept in this browser so it opens and works offline (docs/local-first.md),
 * SvelteKit's way: its built files are cached at install, served from the cache, and
 * replaced by the next version's. Only the app's own files: repos and other services
 * are never cached here.
 */
import {self as worker} from '$app/service-worker'
import {assets, immutable} from '$app/manifest'
import {version} from '$app/env'

const CACHE = `enform-${version}`
/** The app's built files and static ones, as paths from the site's root */
const APP = [...immutable, ...assets].map(
	({path}) => new URL(path, worker.location.origin + '/').pathname
)
/** The single-page app's entry, for any page opened offline */
const SHELL = '/'

worker.addEventListener('install', (event) => {
	event.waitUntil(caches.open(CACHE).then((cache) => cache.addAll([...APP, SHELL])))
})

worker.addEventListener('activate', (event) => {
	event.waitUntil(
		caches
			.keys()
			.then((keys) =>
				Promise.all(keys.filter((key) => key !== CACHE).map((key) => caches.delete(key)))
			)
	)
})

worker.addEventListener('fetch', (event) => {
	const request = event.request
	const url = new URL(request.url)
	if (request.method !== 'GET' || url.origin !== location.origin) return
	event.respondWith(
		(async () => {
			const cache = await caches.open(CACHE)
			// The app's own files never change within a version: from the cache
			if (APP.includes(url.pathname)) return (await cache.match(url.pathname)) ?? fetch(request)
			try {
				return await fetch(request)
			} catch (err) {
				// Offline: a page is the app's entry; other files as last cached
				if (request.mode === 'navigate') {
					const shell = await cache.match(SHELL)
					if (shell) return shell
				}
				const cached = await cache.match(request)
				if (cached) return cached
				throw err
			}
		})()
	)
})
