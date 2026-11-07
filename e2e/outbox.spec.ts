/**
 * Writes made offline wait in the browser, show at once, and are sent when the
 * network is back (docs/local-first.md)
 */
import {approvePopup, expect, signIn, t, test} from './fixtures'

const NSID = 'test.enform.note'

test('a record created offline is sent once back online', async ({page, context}, info) => {
	const online = `Online ${info.project.name} ${Date.now()}`
	const offline = `Offline ${info.project.name} ${Date.now()}`
	const text = page.getByRole('textbox', {name: 'text', exact: true})
	const create = page.getByRole('button', {name: t('new_submit')})

	// Online first: the permission to create is granted
	await signIn(page, 'alice.test')
	await page.goto(`/new/${NSID}`)
	await page.waitForURL(`**/@alice.test/${NSID}?new`)
	await text.fill(online)
	await approvePopup(page, 'alice.test', () => create.click())
	await page.waitForURL((url) => url.pathname.startsWith(`/@alice.test/${NSID}/`) && !url.search)

	// Offline: the new record shows at once, marked as waiting
	await page.goto(`/@alice.test/${NSID}?new`)
	await expect(text).toBeVisible()
	await context.setOffline(true)
	await text.fill(offline)
	await create.click()
	await page.waitForURL((url) => url.pathname.startsWith(`/@alice.test/${NSID}/`) && !url.search)
	await expect(page.locator('enform-record').getByText(offline)).toBeVisible()
	await expect(page.getByText(t('outbox_record_waiting'))).toBeVisible()
	await expect(page.getByRole('link', {name: t('outbox_count', {count: '1'})})).toBeVisible()
	const recordUrl = page.url()

	// Back online: sent by itself, and there for real
	await context.setOffline(false)
	await expect(page.getByRole('link', {name: t('outbox_count', {count: '1'})})).toHaveCount(0)
	await page.goto(recordUrl)
	await expect(page.locator('enform-record').getByText(offline)).toBeVisible()
	await expect(page.getByText(t('outbox_record_waiting'))).toHaveCount(0)
})
