/** Signed in to the local PDS: create, edit and delete a record, each asking permission */
import {approvePopup, closed, creating, expect, opened, signIn, t, test} from './fixtures'

const NSID = 'test.enform.note'

test('create, edit and delete a record of a published lexicon', async ({page}, info) => {
	const text = `Hello from ${info.project.name} ${Date.now()}`
	const edited = `${text} (edited)`

	await signIn(page, 'alice.test')
	await page.goto('/@alice.test')
	await expect(page.getByText('@alice.test').first()).toBeVisible()

	// Create: /new/<nsid> opens the form beside the collection
	await page.goto(`/new/${NSID}`)
	await page.waitForURL(creating)
	await page.getByRole('textbox', {name: 'text', exact: true}).fill(text)
	await approvePopup(page, 'alice.test', () =>
		page.getByRole('button', {name: t('new_submit')}).click()
	)
	await page.waitForURL(opened)
	await expect(page.locator('enform-sheet enform-kind-view').getByText(text).first()).toBeVisible()
	const recordUrl = page.url()

	// Edit
	await page.goto(`${recordUrl}&edit`)
	await page.getByRole('textbox', {name: 'text', exact: true}).fill(edited)
	await approvePopup(page, 'alice.test', () =>
		page.getByRole('button', {name: t('edit_submit')}).click()
	)
	await page.waitForURL((url) => url.href === recordUrl)
	await expect(
		page.locator('enform-sheet enform-kind-view').getByText(edited).first()
	).toBeVisible()

	// Delete, confirmed in a dialog
	await page
		.getByRole('button', {name: t('record_delete'), exact: true})
		.first()
		.click()
	const dialog = page.getByRole('dialog')
	await approvePopup(page, 'alice.test', () =>
		dialog.getByRole('button', {name: t('record_delete')}).click()
	)
	await page.waitForURL(closed)
	await expect(page.getByText(edited)).toHaveCount(0)
})
