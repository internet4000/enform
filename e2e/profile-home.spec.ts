/**
 * Someone's profile in an app is its home there: what their repo has of the app's other
 * types, a shelf each (no link written for it: the same repo, the same app). The profile
 * can be pinned, apart from the app, and is found on Home and in the rail.
 */
import {approvePopup, creating, expect, signIn, t, test} from './fixtures'

test("a profile's home: its shelves, and pinning it", async ({page}, info) => {
	const note = `Shelved ${Date.now()}`
	// The form's own: under it, the app's screen offers to create too
	const submit = () => page.locator('button[type="submit"]', {hasText: t('new_submit')})
	await signIn(page, 'bob.test')

	// One profile per account: made by the first run (the network is shared)
	await page.goto('/@bob.test/apps/enform.test?type=test.enform.profile')
	const made = page.getByRole('heading', {name: "Bob's corner"})
	const toMake = page.getByRole('button', {name: t('app_create_profile', {app: 'enform.test'})})
	await expect(made.or(toMake)).toBeVisible()
	const first = await toMake.isVisible()
	if (first) {
		await page.goto('/new/test.enform.profile')
		await page.waitForURL(creating)
		await page.getByRole('textbox', {name: t('field_display_name')}).fill("Bob's corner")
		await approvePopup(page, 'bob.test', () => submit().click())
		await page.waitForURL((url) => !creating(url))
	}

	await page.goto('/new/test.enform.note')
	await page.waitForURL(creating)
	await page.getByRole('textbox', {name: t('field_text'), exact: true}).fill(note)
	if (first) await submit().click()
	else await approvePopup(page, 'bob.test', () => submit().click())
	await page.waitForURL((url) => !creating(url))

	// The app's screen opens on the profile, with what it has
	await page.goto('/@bob.test/apps/enform.test')
	await expect(page.getByRole('heading', {name: "Bob's corner"})).toBeVisible()
	const shelf = page.locator('enform-type-shelf').filter({hasText: note})
	await expect(shelf).toBeVisible()
	await expect(shelf.getByRole('button', {name: t('reader_read_all')})).toBeVisible()
	await expect(shelf.getByRole('button', {name: /^\+ /})).toBeVisible()
	await expect(
		page.getByRole('navigation', {name: t('app_tabs')}).getByRole('link', {name: t('app_overview')})
	).toHaveAttribute('aria-current', 'page')

	// Its profile's tab is the profile record alone, not the home again
	await page.goto('/@bob.test/apps/enform.test?type=test.enform.profile')
	await expect(page.locator('enform-record-bar')).toBeVisible()
	await expect(page.locator('enform-type-shelf')).toHaveCount(0)
	await page.goto('/@bob.test/apps/enform.test')

	// Pinned, apart from the app
	await page.getByRole('button', {name: /^Pin @bob\.test on /}).click()
	await expect(page.getByRole('button', {name: /^Unpin @bob\.test on /})).toHaveAttribute(
		'aria-pressed',
		'true'
	)
	await page.goto('/')
	await expect(
		page.locator('main enform-launcher').getByRole('link', {name: /@bob\.test/})
	).toBeVisible()
	if (info.project.name === 'desktop') {
		const rail = page.getByRole('navigation', {name: t('nav_main')}).locator('section')
		await expect(rail.getByRole('link', {name: '@bob.test'})).toBeVisible()
	}

	// Unpinned in Settings
	await page.goto('/settings/pins')
	await page.getByRole('button', {name: /^Unpin @bob\.test on /}).click()
	await expect(page.getByText(t('pins_none'))).toBeVisible()
})
