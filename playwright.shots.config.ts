import base from './playwright.config'
const app = 'http://127.0.0.1:5199'
export default {
	...base,
	use: {...base.use, baseURL: app},
	webServer: [
		(base.webServer as any[])[0],
		{
			command: `vite build --mode e2e && vite build -c vite.embed.config.ts --mode e2e && vite preview --mode e2e --port 5199 --strictPort`,
			url: app,
			reuseExistingServer: false,
			timeout: 180_000
		}
	]
}
