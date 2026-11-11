/**
 * What is made on this device stays private: an account's records, which are public,
 * can't point at it (docs/local-first.md)
 */
import {creating, expect, opened, signIn, t, test} from './fixtures'

test("an account's record can't point at a record on this device", async ({page}) => {
	// A status, on this device
	await page.goto('/apps/statusphere.xyz')
	await page.getByRole('button', {name: t('start_device_button')}).click()
	await page.waitForURL(creating)
	const handle = new URL(page.url()).pathname.split('/')[1].slice(1)
	const form = page.locator('enform-form')
	await form.getByRole('textbox').first().fill('🙂')
	await form.getByRole('button', {name: t('new_submit')}).click()
	await page.waitForURL(opened)
	const rkey = new URL(page.url()).searchParams.get('record')!

	// Signed in, liking it from an account: refused, nothing written
	await signIn(page, 'alice.test')
	await page.getByRole('button', {name: t('accounts_switch_to', {actor: 'alice.test'})}).click()
	await expect(page.getByText(t('accounts_current')).first()).toBeVisible()
	await page.goto('/@alice.test/apps/enform.test?type=test.enform.like&new')
	await page.waitForURL(creating)
	const subject = form.locator('[id$="-subject"]').first()
	await subject.fill(`at://${handle}/xyz.statusphere.status/${rkey}`)
	await subject.blur()
	await expect(form.getByText(t('form_strongref_found'))).toBeVisible()
	await form.getByRole('button', {name: t('new_submit')}).click()
	await expect(page.getByText(t('local_stays_private'))).toBeVisible()
	await expect(page).toHaveURL(creating)
})
