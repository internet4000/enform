/**
 * No account: a local profile keeps records in the browser. The lexicon still resolves,
 * from the local network (e2e/lexicons/statusphere.xyz).
 */
import {expect, t, test} from './fixtures'

test('try an app on this device: create, edit and delete a record', async ({page}) => {
	await page.goto('/apps/statusphere.xyz')
	await page.getByRole('button', {name: t('apps_try_local')}).click()
	await page.waitForURL((url) => url.search === '?new')

	const form = page.locator('enform-form')
	await form.getByRole('textbox').first().fill('🙂')
	await form.getByRole('button', {name: t('new_submit')}).click()
	await page.waitForURL((url) => url.pathname.split('/').length === 4 && !url.search)
	await expect(page.locator('enform-record').getByText('🙂').first()).toBeVisible()
	const recordUrl = page.url()

	await page.goto(`${recordUrl}?edit`)
	await form.getByRole('textbox').first().fill('🎉')
	await form.getByRole('button', {name: t('edit_submit')}).click()
	await page.waitForURL((url) => url.href === recordUrl)
	await expect(page.locator('enform-record').getByText('🎉').first()).toBeVisible()

	await page.getByRole('button', {name: t('record_delete'), exact: true}).first().click()
	await page.getByRole('dialog').getByRole('button', {name: t('record_delete')}).click()
	await page.waitForURL((url) => url.pathname.split('/').length === 3)
	await expect(page.locator('enform-records li a')).toHaveCount(0)
})
