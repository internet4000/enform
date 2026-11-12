// A link from before hash routing (…/@alice/apps/bsky.app) opens at its address after
// `#` (…/#/@alice/apps/bsky.app), in place, before the app starts: static hosts serve
// this page for any path they have no file for (404.html).
;(() => {
	const base = new URL('./', document.currentScript.src).pathname
	const {pathname, search} = location
	if (pathname === base || !pathname.startsWith(base)) return
	const address = pathname.slice(base.length - 1).replace(/^\/index\.html$/, '/')
	history.replaceState(history.state, '', `${base}#${address}${search}`)
})()
