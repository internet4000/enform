/**
 * A permission's answer coming back in its popup shows what happened, not the app; one
 * that can't be handed over (its state unknown) says so, with a way to close it
 */
import {expect, t, test} from './fixtures'

test('an answer in a popup shows what happened, not the app', async ({page}) => {
	await page.goto('/')
	// As while a page waits on a permission popup
	await page.evaluate(() => localStorage.setItem('enform:popup', String(Date.now())))
	await page.goto('/?state=unknown&code=nothing')
	await expect(page.locator('enform-app')).toHaveCount(0)
	await expect(page.getByRole('status')).toContainText(t('popup_failed', {error: ''}).split('(')[0])
	await expect(page.getByRole('button', {name: t('popup_close')})).toBeVisible()

	// Refused: said at once
	await page.goto('/?state=unknown&error=access_denied')
	await expect(page.getByRole('status')).not.toContainText(t('popup_working'))
})

test('without a popup waiting, the same address is the app', async ({page}) => {
	await page.goto('/?state=unknown&code=nothing')
	await expect(page.locator('enform-app')).toHaveCount(1)
})
