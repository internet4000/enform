/**
 * The shared UI quality gate (e2e/quality.js, from savoir-faire) on enform's main screens.
 * A single-page app renders after it starts: each screen is checked once its heading is
 * there (plan.md: render screens before their data arrives).
 */
import type {Page} from '@playwright/test'
import {qualityTests} from './quality.js'

const loaded = (path: string) => async (page: Page) => {
	await page.goto(path)
	await page.locator('h1').first().waitFor()
}

qualityTests([
	{name: 'home', open: loaded('/'), touch: 44},
	{name: 'explore', open: loaded('/explore'), touch: 44},
	{name: 'settings', open: loaded('/settings'), touch: 44},
	{name: 'accounts', open: loaded('/settings/accounts'), touch: 44},
	{name: 'privacy', open: loaded('/settings/privacy'), touch: 44},
	{name: 'search', open: loaded('/search?q=alice.test'), touch: 44},
	{name: 'app page', open: loaded('/apps/statusphere.xyz'), touch: 44},
	{name: 'person', open: loaded('/@alice.test'), touch: 44},
	{
		name: 'app screen',
		open: loaded('/@alice.test/apps/enform.test?type=test.enform.note'),
		touch: 44
	},
	{name: 'data', open: loaded('/data/@alice.test'), touch: 44}
])
