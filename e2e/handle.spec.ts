/**
 * Changing your handle: under your server's domain (asking for the permission the first
 * time), and, for your own domain, what to publish there before it can be saved. Its own
 * account, renamed and named back, so the others keep theirs.
 */
import {approvePopup, expect, signIn, t, test} from './fixtures'

test('change your handle, and what your own domain needs', async ({page}, testInfo) => {
	await signIn(page, 'handles.test')
	await page.goto('/settings')
	await page.getByRole('link', {name: t('handle_title'), exact: true}).click()
	await expect(page.getByRole('main').getByText('@handles.test')).toBeVisible()

	// Your own domain: what to publish there, and it doesn't point at you yet
	await page.getByRole('switch', {name: t('handle_own_domain')}).check()
	const field = page.getByRole('textbox', {name: t('handle_label')})
	await field.fill('example.com')
	await expect(page.getByText('_atproto.example.com')).toBeVisible()
	await expect(page.getByText(/^did=did:plc:/)).toBeVisible()
	await page.getByRole('button', {name: t('handle_check')}).click()
	await expect(page.getByText(t('handle_points_none', {domain: 'example.com'}))).toBeVisible()

	// A name under the server's domain: the first change asks for the permission
	await page.getByRole('switch', {name: t('handle_own_domain')}).uncheck()
	const renamed = `renamed-${testInfo.project.name}`
	await field.fill(renamed)
	await approvePopup(page, 'handles.test', () =>
		page.getByRole('button', {name: t('handle_save')}).click()
	)
	const done = (handle: string) => t('handle_done', {handle: `@${handle}`})
	await expect(page.getByText(done(`${renamed}.test`))).toBeVisible()
	await expect(page.getByText(`@${renamed}.test`).first()).toBeVisible()

	// Named back: no permission asked again
	await field.fill('handles')
	await page.getByRole('button', {name: t('handle_save')}).click()
	await expect(page.getByText(done('handles.test'))).toBeVisible()
})
