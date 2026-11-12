/**
 * Deleting all of an app's records in your repo: counted across pages, reviewed (a copy
 * to save, the count typed to confirm), deleted in batches, with the one permission
 * that needs asked for then
 */
import {account, approvePopup, expect, signIn, t, test} from './fixtures'
import network from './network.json' with {type: 'json'}

test("delete all of an app's records", async ({page, request}) => {
	const pds = `http://localhost:${network.ports.pds}`
	const {handle, password} = account('alice.test')
	const session = await request.post(`${pds}/xrpc/com.atproto.server.createSession`, {
		data: {identifier: handle, password}
	})
	const {did, accessJwt} = await session.json()
	// More than a page and a batch: two types of one app
	const writes = Array.from({length: 150}, (_, index) => {
		const collection = index % 3 ? 'test.bulk.item' : 'test.bulk.note'
		return {
			$type: 'com.atproto.repo.applyWrites#create',
			collection,
			value: {$type: collection, title: `Bulk ${index}`, createdAt: new Date().toISOString()}
		}
	})
	const created = await request.post(`${pds}/xrpc/com.atproto.repo.applyWrites`, {
		headers: {authorization: `Bearer ${accessJwt}`},
		data: {repo: did, validate: false, writes}
	})
	expect(created.ok()).toBeTruthy()

	await signIn(page, 'alice.test')
	await page.goto('/@alice.test/apps/bulk.test')
	await page
		.locator('enform-app-screen > header')
		.getByRole('button', {name: t('record_menu')})
		.click()
	await page.getByRole('button', {name: t('bulk_delete_menu')}).click()

	const dialog = page.getByRole('dialog')
	await expect(dialog.getByText('150', {exact: false}).first()).toBeVisible()
	await expect(dialog.getByText(/test\.bulk\.item/)).toBeVisible()
	await expect(dialog.getByText(/test\.bulk\.note/)).toBeVisible()

	// A copy first
	const [download] = await Promise.all([
		page.waitForEvent('download'),
		dialog.getByRole('button', {name: t('bulk_save_copy')}).click()
	])
	expect(download.suggestedFilename()).toMatch(/^alice\.test-test\.bulk-.*\.json$/)

	// The count typed to confirm
	const submit = dialog.getByRole('button', {name: t('bulk_delete_button', {count: '150'})})
	await expect(submit).toBeDisabled()
	await dialog.getByRole('textbox', {name: t('bulk_confirm', {count: '150'})}).fill('150')
	await approvePopup(page, 'alice.test', () => submit.click())
	await expect(dialog.getByText(t('bulk_done', {deleted: '150'}))).toBeVisible({timeout: 30_000})

	for (const collection of ['test.bulk.item', 'test.bulk.note']) {
		const listed = await request.get(`${pds}/xrpc/com.atproto.repo.listRecords`, {
			params: {repo: did, collection}
		})
		expect((await listed.json()).records).toHaveLength(0)
	}
})
