/** Addresses are after `#`, never sent to the host; links from before still open */
import {address, expect, t, test} from './fixtures'

test('a link from before opens at its address after #', async ({page}) => {
	await page.goto('/@alice.test/apps/enform.test?type=test.enform.note')
	await expect(page).toHaveURL(/\/#\/@alice\.test\/apps\/enform\.test\?type=test\.enform\.note$/)
	await expect(page.getByRole('link', {name: '@alice.test'}).first()).toBeVisible()

	await page.goto('/settings')
	await expect(page).toHaveURL(/\/#\/settings$/)
	await expect(page.getByRole('heading', {name: t('nav_settings')})).toBeVisible()
})

test('a repo, two views at one address: App, and Data under /data', async ({page}) => {
	await page.goto('/@alice.test')
	const views = page.getByRole('navigation', {name: t('view_switch'), exact: true})
	await expect(views.getByRole('link', {name: t('view_app')})).toHaveAttribute(
		'aria-current',
		'page'
	)
	await views.getByRole('link', {name: t('view_data')}).click()
	await page.waitForURL((url) => address(url).pathname === '/data/@alice.test')

	// An app's tab, then the same place as stored, and back
	await page.goto('/@alice.test/apps/enform.test?type=test.enform.note')
	await views.getByRole('link', {name: t('view_data')}).click()
	await page.waitForURL(
		(url) =>
			address(url).pathname === '/data/@alice.test/apps/enform.test' &&
			address(url).searchParams.get('type') === 'test.enform.note'
	)
	await expect(
		page.getByRole('heading', {level: 2, name: 'Note', exact: false}).first()
	).toBeVisible()
	await views.getByRole('link', {name: t('view_app')}).click()
	await page.waitForURL(
		(url) =>
			address(url).pathname === '/@alice.test/apps/enform.test' &&
			address(url).searchParams.get('type') === 'test.enform.note'
	)

	// Addresses from before land in the data view
	await page.goto('/@alice.test/test.enform.note')
	await page.waitForURL(
		(url) =>
			address(url).pathname === '/data/@alice.test/apps/enform.test' &&
			address(url).searchParams.get('type') === 'test.enform.note'
	)
	await page.goto('/@alice.test/data')
	await page.waitForURL((url) => address(url).pathname === '/data/@alice.test')
})
