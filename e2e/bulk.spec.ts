/**
 * Many records at once, as in a mailbox: Select on a list, cards checked (a shift-click
 * for a range, a box for all shown, then all that match on every page), and what to do
 * with them: set a field with its own control, delete them (the count typed when many)
 */
import type {APIRequestContext} from '@playwright/test'
import {account, approvePopup, expect, signIn, t, test} from './fixtures'
import network from './network.json' with {type: 'json'}

const pds = `http://localhost:${network.ports.pds}`

async function seed(request: APIRequestContext, collection: string, values: object[]) {
	const {handle, password} = account('alice.test')
	const session = await request.post(`${pds}/xrpc/com.atproto.server.createSession`, {
		data: {identifier: handle, password}
	})
	const {did, accessJwt} = await session.json()
	const created = await request.post(`${pds}/xrpc/com.atproto.repo.applyWrites`, {
		headers: {authorization: `Bearer ${accessJwt}`},
		data: {
			repo: did,
			validate: false,
			writes: values.map((value) => ({
				$type: 'com.atproto.repo.applyWrites#create',
				collection,
				value: {$type: collection, createdAt: new Date().toISOString(), ...value}
			}))
		}
	})
	expect(created.ok()).toBeTruthy()
	return did as string
}

async function left(request: APIRequestContext, did: string, collection: string) {
	const listed = await request.get(`${pds}/xrpc/com.atproto.repo.listRecords`, {
		params: {repo: did, collection, limit: 100}
	})
	return (await listed.json()).records as {value: {text?: string}}[]
}

test('select some, edit a field of them, delete them', async ({page, request}) => {
	const tag = `b${Date.now()}`
	const did = await seed(
		request,
		'test.enform.note',
		['One', 'Two', 'Three'].map((word) => ({text: `${word} ${tag}`}))
	)
	await signIn(page, 'alice.test')
	await page.goto(`/@alice.test/apps/enform.test?type=test.enform.note&q=${tag}`)
	const grid = page.locator('enform-record-grid')
	await expect(grid.locator('enform-record-card-item')).toHaveCount(3)

	await page.getByRole('button', {name: t('select_start')}).click()
	const bar = page.locator('enform-selection-bar')
	const boxes = grid.getByRole('checkbox')
	await boxes.first().click()
	await boxes.last().click({modifiers: ['Shift']})
	await expect(bar).toContainText(t('select_count', {count: '3'}))
	await bar.getByRole('checkbox', {name: t('select_shown')}).uncheck()
	await expect(bar).toContainText(t('select_count', {count: '0'}))
	await bar.getByRole('checkbox', {name: t('select_shown')}).check()

	// One field, with its own control, set on all of them
	await bar.getByRole('button', {name: t('select_edit')}).click()
	const dialog = page.getByRole('dialog')
	await dialog.getByRole('combobox', {name: t('bulk_edit_field')}).selectOption('text')
	await dialog.getByRole('textbox').fill(`Edited ${tag}`)
	await approvePopup(page, 'alice.test', () =>
		dialog.getByRole('button', {name: t('bulk_edit_set', {count: '3'})}).click()
	)
	await expect(dialog.getByText(t('bulk_edited', {count: '3'}))).toBeVisible()
	await dialog.getByRole('button', {name: t('sheet_close')}).click()
	await expect(grid.getByText(`Edited ${tag}`)).toHaveCount(3)
	expect(
		(await left(request, did, 'test.enform.note')).filter((r) => r.value.text === `Edited ${tag}`)
	).toHaveLength(3)

	// Then deleted: few, so no count to type
	await page.getByRole('button', {name: t('select_start')}).click()
	await bar.getByRole('checkbox', {name: t('select_shown')}).check()
	await bar.getByRole('button', {name: t('select_delete')}).click()
	await approvePopup(page, 'alice.test', () =>
		dialog.getByRole('button', {name: t('bulk_delete_button', {count: '3'})}).click()
	)
	await expect(dialog.getByText(t('bulk_deleted', {count: '3'}))).toBeVisible()
	expect(
		(await left(request, did, 'test.enform.note')).filter((r) => r.value.text?.includes(tag))
	).toHaveLength(0)
})

test('select all that match on every page, and delete them', async ({page, request}) => {
	const collection = 'test.bulk.item'
	const did = await seed(
		request,
		collection,
		Array.from({length: 150}, (_, index) => ({title: `Bulk ${index}`}))
	)
	await signIn(page, 'alice.test')
	await page.goto(`/@alice.test/apps/bulk.test?type=${collection}`)
	await page.getByRole('button', {name: t('select_start')}).click()
	const bar = page.locator('enform-selection-bar')
	await bar.getByRole('checkbox', {name: t('select_shown')}).check()
	await bar.getByRole('button', {name: t('select_all_matching')}).click()
	await expect(bar).toContainText(t('select_all_chosen', {count: '150'}))

	// A copy first, then the count typed
	await bar.getByRole('button', {name: t('select_delete')}).click()
	const dialog = page.getByRole('dialog')
	const [download] = await Promise.all([
		page.waitForEvent('download'),
		dialog.getByRole('button', {name: t('bulk_save_copy')}).click()
	])
	expect(download.suggestedFilename()).toMatch(/^alice\.test-test\.bulk\.item-.*\.json$/)
	const submit = dialog.getByRole('button', {name: t('bulk_delete_button', {count: '150'})})
	await expect(submit).toBeDisabled()
	await dialog.getByRole('textbox', {name: t('bulk_confirm', {count: '150'})}).fill('150')
	await approvePopup(page, 'alice.test', () => submit.click())
	await expect(dialog.getByText(t('bulk_deleted', {count: '150'}))).toBeVisible({
		timeout: 30_000
	})
	expect(await left(request, did, collection)).toHaveLength(0)
})
