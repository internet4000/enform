import {defineConfig, devices} from '@playwright/test'
import network from './e2e/network.json' with {type: 'json'}

/**
 * End-to-end tests (e2e/*.spec.ts) against a local atproto network (e2e/network.mjs:
 * PLC, PDS with its OAuth pages, DNS-over-HTTPS), and the app in `--mode e2e`, which
 * points its config at that network. Chromium only, at a phone and a desktop size.
 * Requests anywhere else are blocked (e2e/fixtures.ts), so tests run offline.
 */
const app = `http://127.0.0.1:${network.ports.app}`

export default defineConfig({
	testDir: 'e2e',
	timeout: 60_000,
	expect: {timeout: 15_000},
	// Tests share the network's accounts, and the PDS serves one sign-in at a time well
	fullyParallel: false,
	workers: 1,
	forbidOnly: !!process.env.CI,
	retries: 0,
	reporter: [['list']],
	use: {
		baseURL: app,
		locale: 'en-GB',
		timezoneId: 'UTC',
		trace: 'retain-on-failure',
		screenshot: 'only-on-failure'
	},
	projects: [
		{name: 'phone', use: {...devices['Desktop Chrome'], viewport: {width: 390, height: 844}}},
		{name: 'desktop', use: {...devices['Desktop Chrome'], viewport: {width: 1440, height: 900}}}
	],
	// In order: the app's e2e config is written by the network
	webServer: [
		{
			command: 'node e2e/network.mjs',
			url: `http://localhost:${network.ports.dns}/health`,
			reuseExistingServer: !process.env.CI,
			timeout: 120_000
		},
		{
			command: `vite dev --mode e2e --port ${network.ports.app} --strictPort`,
			url: app,
			reuseExistingServer: !process.env.CI,
			timeout: 120_000
		}
	]
})
