/** Two accounts of the local PDS on one browser: add one, then switch back */
import {address, expect, signIn, t, test} from './fixtures'

test('add a second account and switch between them', async ({page}) => {
	await signIn(page, 'alice.test')
	await signIn(page, 'bob.test')

	const accounts = page.locator('enform-accounts')
	const current = accounts.locator('enform-account-item[current]')
	await expect(accounts.getByRole('listitem')).toHaveCount(2)
	await expect(current.getByRole('link', {name: /@bob\.test/})).toBeVisible()

	await accounts.getByRole('button', {name: t('accounts_switch_to', {actor: 'alice.test'})}).click()
	await expect(current.getByRole('link', {name: /@alice\.test/})).toBeVisible()

	// The main navigation: your profile (who you are, said), then Settings, you at its top
	await page.goto('/')
	const nav = page.getByRole('navigation', {name: t('nav_main')})
	await expect(nav.getByRole('link', {name: t('nav_profile')})).toHaveAttribute(
		'title',
		'@alice.test'
	)
	await nav.getByRole('link', {name: t('nav_settings')}).click()
	await page.waitForURL((url) => address(url).pathname === '/settings')
	await expect(page.locator('enform-settings-you').getByText(/@alice\.test/)).toBeVisible()
	// One row to switch, back to the list of every account
	await page.getByRole('link', {name: t('accounts_switch_title')}).click()
	await page.waitForURL((url) => address(url).pathname === '/settings/accounts')
	await expect(current.getByRole('link', {name: /@alice\.test/})).toBeVisible()

	// The old address of that list still opens it
	await page.goto('/#/settings/profiles')
	await page.waitForURL((url) => address(url).pathname === '/settings/accounts')
})
