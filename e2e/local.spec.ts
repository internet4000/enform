/**
 * No account: a local profile keeps records in the browser. The lexicon still resolves,
 * from the local network (e2e/lexicons/statusphere.xyz).
 */
import {closed, creating, expect, opened, t, test} from './fixtures'

test('try an app on this device: create, edit and delete a record', async ({page}) => {
	await page.goto('/apps/statusphere.xyz')
	await page.getByRole('button', {name: t('apps_try_local')}).click()
	await page.waitForURL(creating)

	const form = page.locator('enform-form')
	await form.getByRole('textbox').first().fill('🙂')
	await form.getByRole('button', {name: t('new_submit')}).click()
	await page.waitForURL(opened)
	await expect(page.locator('enform-sheet enform-kind-view').getByText('🙂').first()).toBeVisible()
	const recordUrl = page.url()

	// Back on the app's page, it knows you are on it: you first, your status to edit
	await page.goto('/apps/statusphere.xyz')
	const yours = page.getByRole('region', {name: t('apps_your_place')})
	await expect(
		yours.getByRole('button', {name: t('apps_open_yours', {app: 'Statusphere'})})
	).toBeVisible()
	await expect(page.getByRole('heading', {name: t('apps_your_place')})).toHaveCount(1)
	await page.goto(`${recordUrl}&edit`)
	await form.getByRole('textbox').first().fill('🎉')
	await form.getByRole('button', {name: t('edit_submit')}).click()
	await page.waitForURL((url) => url.href === recordUrl)
	await expect(page.locator('enform-sheet enform-kind-view').getByText('🎉').first()).toBeVisible()

	await page
		.getByRole('button', {name: t('record_delete'), exact: true})
		.first()
		.click()
	await page
		.getByRole('dialog', {name: t('record_delete_confirm_title')})
		.getByRole('button', {name: t('record_delete')})
		.click()
	await page.waitForURL(closed)
	await expect(page.locator('enform-record-card-item')).toHaveCount(0)
})
