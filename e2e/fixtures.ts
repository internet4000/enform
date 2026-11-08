/**
 * What the specs share: the app's own messages (no strings of ours in tests), the local
 * network's accounts, offline browsing, and the PDS's OAuth pages (its sign-in and
 * consent, as the local PDS shows them).
 */
import {test as base, expect, type Page} from '@playwright/test'
import messages from '../i18n/messages/en.json' with {type: 'json'}
import network from './network.json' with {type: 'json'}

type MessageKey = Exclude<keyof typeof messages, '$schema'>

/** An app message in English, with its {params} filled */
export function t(key: MessageKey, params: Record<string, string> = {}): string {
	return (messages[key] as string).replace(/\{(\w+)\}/g, (_, name) => params[name] ?? '')
}

export function account(handle: string) {
	const found = network.accounts.find((a) => a.handle === handle)
	if (!found) throw new Error(`No account ${handle} in e2e/network.json`)
	return found
}

const LOCAL = new Set(['127.0.0.1', 'localhost'])

export const test = base.extend({
	// Only the app and the local network: the tests must not depend on the internet
	context: async ({context}, use) => {
		await context.route(
			(url) => !LOCAL.has(url.hostname) && url.protocol !== 'data:',
			(route) => route.abort('blockedbyclient')
		)
		await use(context)
	}
})

export {expect}

/** The local PDS's OAuth pages: sign in when asked, then authorize */
export async function authorizeOnPds(page: Page, handle: string) {
	const {password} = account(handle)
	const passwordField = page.getByRole('textbox', {name: 'Password'})
	const authorize = page.getByRole('button', {name: 'Authorize'})
	await expect(passwordField.or(authorize).first()).toBeVisible()
	if (await passwordField.isVisible()) {
		await passwordField.fill(password)
		await page.getByRole('button', {name: 'Sign in'}).click()
	}
	await authorize.click()
}

/** Signs in through Settings, as the first account or another one */
export async function signIn(page: Page, handle: string) {
	await page.goto('/more')
	await expect(page.getByRole('textbox', {name: t('session_handle_label')})).toBeVisible()
	const adding = await page.getByRole('button', {name: t('accounts_add_submit')}).isVisible()
	await page.getByRole('textbox', {name: t('session_handle_label')}).fill(handle)
	await page
		.getByRole('button', {name: adding ? t('accounts_add_submit') : t('session_sign_in')})
		.click()
	await page.waitForURL((url) => url.port === String(network.ports.pds))
	await authorizeOnPds(page, handle)
	await page.waitForURL((url) => url.hostname === '127.0.0.1' && url.pathname === '/more')
	await expect(page.getByRole('link', {name: `@${handle}`}).first()).toBeVisible()
}

/** Approves a permission step-up, which the app opens in a popup */
export async function approvePopup(page: Page, handle: string, action: () => Promise<void>) {
	const [popup] = await Promise.all([page.waitForEvent('popup'), action()])
	await authorizeOnPds(popup, handle)
	await popup.waitForEvent('close')
}

/** In an app's screen: a form to create open over it */
export const creating = (url: URL) => url.searchParams.has('new')
/** In an app's screen: a record open over it (not its form) */
export const opened = (url: URL) =>
	url.searchParams.has('record') && !url.searchParams.has('edit') && !url.searchParams.has('new')
/** In an app's screen: nothing open over it */
export const closed = (url: URL) =>
	url.pathname.includes('/apps/') && !url.searchParams.has('record')
