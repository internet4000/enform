/** Two accounts of the local PDS on one browser: add one, then switch back */
import {expect, signIn, t, test} from './fixtures'

test('add a second account and switch between them', async ({page}) => {
	await signIn(page, 'alice.test')
	await signIn(page, 'bob.test')

	const accounts = page.locator('enform-accounts')
	const current = accounts.locator('enform-account-item[current]')
	await expect(accounts.getByRole('listitem')).toHaveCount(2)
	await expect(current.getByRole('link', {name: '@bob.test'})).toBeVisible()

	await accounts.getByRole('button', {name: t('accounts_switch_to', {actor: 'alice.test'})}).click()
	await expect(current.getByRole('link', {name: '@alice.test'})).toBeVisible()
	// You, at the top of Settings: who you act as, and where your records are
	await expect(page.locator('enform-you').getByText('@alice.test')).toBeVisible()

	// Who you are, in the main navigation, opens Settings
	await page.goto('/')
	await page
		.getByRole('navigation', {name: t('nav_main')})
		.getByRole('link', {name: '@alice.test'})
		.click()
	await page.waitForURL((url) => url.pathname === '/settings')
})
