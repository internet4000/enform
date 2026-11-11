/** Pinning apps: from an app's page, first on Home, in the rail, reordered and unpinned in Settings */
import {creating, expect, t, test} from './fixtures'

test('pin apps, find them first, reorder and unpin them', async ({page}, info) => {
	for (const domain of ['tangled.org', '4000.radio']) {
		await page.goto(`/apps/${domain}`)
		await page.getByRole('button', {name: /^Pin /}).click()
		await expect(page.getByRole('button', {name: /^Unpin /})).toHaveAttribute(
			'aria-pressed',
			'true'
		)
	}

	// First on Home, in the order pinned
	await page.goto('/')
	const home = page.locator('main enform-launcher').first().getByRole('link')
	await expect(home.nth(0)).toContainText('Tangled')
	await expect(home.nth(1)).toContainText('Radio4000')

	// In the rail, on wide screens
	const rail = page.getByRole('navigation', {name: t('nav_main')}).locator('section')
	if (info.project.name === 'desktop') {
		await expect(rail.getByRole('heading', {name: t('pins_title')})).toBeVisible()
		await expect(rail.getByRole('link').first()).toContainText('Tangled')
	} else {
		await expect(rail).toBeHidden()
	}

	// Reordered, then unpinned, in Settings; kept across a reload (on this device)
	await page.goto('/settings')
	await page.getByRole('link', {name: new RegExp(`^${t('pins_title')}`)}).click()
	await page.waitForURL((url) => url.pathname === '/settings/pins')
	await page.getByRole('button', {name: t('pins_move_up', {app: 'Radio4000'})}).click()
	await page.reload()
	const pins = page.locator('enform-pins').getByRole('link')
	await expect(pins.nth(0)).toContainText('Radio4000')
	await page.getByRole('button', {name: t('unpin_app', {app: 'Radio4000'})}).click()
	await page.getByRole('button', {name: t('unpin_app', {app: 'Tangled'})}).click()
	await expect(page.getByText(t('pins_none'))).toBeVisible()
})

test('each profile has its own pins; the first takes those made signed out', async ({page}) => {
	// Signed out, on a new browser, Tangled is pinned
	await page.goto('/apps/tangled.org')
	await page.getByRole('button', {name: t('pin_app', {app: 'Tangled'})}).click()

	// Starting a local profile, it is still there: now the profile's
	await page.goto('/apps/statusphere.xyz')
	await page.getByRole('button', {name: t('start_device_button')}).click()
	await page.waitForURL(creating)
	await page.goto('/apps/statusphere.xyz')
	await page.getByRole('button', {name: t('pin_app', {app: 'Statusphere'})}).click()
	await page.goto('/settings/pins')
	const pins = page.locator('enform-pins').getByRole('link')
	await expect(pins).toHaveCount(2)
	await expect(pins.nth(0)).toContainText('Tangled')
	await expect(pins.nth(1)).toContainText('Statusphere')

	// Back to no one acting, they stay the profile's
	await page.evaluate(() => localStorage.removeItem('enform:local'))
	await page.reload()
	await expect(page.getByText(t('pins_none'))).toBeVisible()
})
