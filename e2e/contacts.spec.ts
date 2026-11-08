/**
 * Quick actions, from lexicons alone: on Home, what you make in your apps; on someone's
 * page, how to reach them (here, a follow: a type whose record names an account), its
 * form opened with them in it
 */
import {approvePopup, creating, expect, opened, signIn, t, test} from './fixtures'

test('quick actions on Home, and following someone from their page', async ({page}) => {
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

	// Bob, on Alice's page: follow her in an app she uses, the form already naming her
	await signIn(page, 'bob.test')
	await page.goto('/@alice.test')
	const contact = page.getByRole('region', {name: t('contact_title', {actor: '@alice.test'})})
	await contact
		.getByRole('link', {name: new RegExp(t('contact_follow', {actor: '@alice.test'}))})
		.click()
	await page.waitForURL(creating)
	await expect(page.locator('enform-form').getByRole('textbox').first()).toHaveValue(/^did:/)
	await approvePopup(page, 'bob.test', () =>
		page.getByRole('button', {name: t('new_submit')}).click()
	)
	await page.waitForURL(opened)
})
