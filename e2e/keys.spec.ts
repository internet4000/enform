/** A lexicon whose key is `any`: the form asks for it (here, an organization's domain) */
import {creating, expect, t, test} from './fixtures'

test('choose the key of a record when its lexicon lets you', async ({page}) => {
	await page.goto('/apps/statusphere.xyz')
	await page.getByRole('button', {name: t('start_device_button')}).click()
	await page.waitForURL(creating)
	const local = new URL(page.url()).pathname.split('/apps/')[0]
	await page.goto(`${local}/apps/enform.test?type=test.enform.org&new`)

	const form = page.locator('enform-form')
	await expect(form.getByText('Its record key is its domain.')).toBeVisible()
	const key = form.getByRole('textbox', {name: t('form_key_label')})
	await key.fill('not a key')
	await expect(form.getByText(t('form_key_invalid'))).toBeVisible()
	await key.fill('example.org')
	await form.getByRole('textbox', {name: 'Name'}).fill('Example')
	await form.getByRole('button', {name: t('new_submit')}).click()
	await page.waitForURL((url) => url.searchParams.get('record') === 'example.org')
})
