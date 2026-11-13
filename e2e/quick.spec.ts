/** Quick actions, from lexicons alone: on Home, what you make in your apps */
import {approvePopup, creating, expect, opened, signIn, t, test} from './fixtures'

test('quick actions on Home', async ({page}) => {
	await signIn(page, 'alice.test')
	await page.goto('/new/test.enform.note')
	await page.waitForURL(creating)
	await page.getByRole('textbox', {name: t('field_text'), exact: true}).fill('Hello')
	await approvePopup(page, 'alice.test', () =>
		page.getByRole('button', {name: t('new_submit')}).click()
	)
	await page.waitForURL(opened)

	// Home: what Alice makes in her apps, one tap away
	await page.goto('/')
	const quick = page.getByRole('region', {name: t('quick_title')})
	await expect(quick.getByRole('link', {name: /Note/})).toBeVisible()
})
