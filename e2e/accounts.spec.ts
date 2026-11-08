/** Two accounts of the local PDS on one browser: add one, then switch back */
import {expect, signIn, t, test} from './fixtures'

test('add a second account and switch between them', async ({page}, info) => {
	await signIn(page, 'alice.test')
	await signIn(page, 'bob.test')

	const accounts = page.locator('enform-accounts')
	const current = accounts.locator('enform-account-item[current]')
	await expect(accounts.getByRole('listitem')).toHaveCount(2)
	await expect(current.getByRole('link', {name: '@bob.test'})).toBeVisible()

	await accounts.getByRole('button', {name: t('accounts_switch_to', {actor: 'alice.test'})}).click()
	await expect(current.getByRole('link', {name: '@alice.test'})).toBeVisible()
	await expect(page.getByText(t('account_signed_in_as'))).toBeVisible()
	await expect(
		page.locator('enform-account > p').getByRole('link', {name: '@alice.test'})
	).toBeVisible()

	// On wide screens, from the account menu at the rail's bottom too
	if (info.project.name !== 'desktop') return
	const menu = page.getByRole('button', {name: t('account_menu', {actor: '@alice.test'})})
	const switchToBob = page.getByRole('button', {
		name: t('accounts_switch_to', {actor: '@bob.test'})
	})
	// A menu closes with Escape (popovers on custom elements must say "auto")
	await menu.click()
	await expect(switchToBob).toBeVisible()
	await page.keyboard.press('Escape')
	await expect(switchToBob).toBeHidden()
	await menu.click()
	await switchToBob.click()
	await expect(
		page.getByRole('button', {name: t('account_menu', {actor: '@bob.test'})})
	).toBeVisible()
})
