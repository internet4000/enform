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

test('a repo, two views: App and Data, each where one is in the other', async ({page}) => {
	await page.goto('/@alice.test')
	const views = page.getByRole('navigation', {name: t('view_label')})
	await expect(views.getByRole('link', {name: t('view_app')})).toHaveAttribute(
		'aria-current',
		'page'
	)
	await views.getByRole('link', {name: t('view_data')}).click()
	await page.waitForURL((url) => address(url).pathname === '/@alice.test/data')
	await page.goto('/@alice.test/test.enform.note')
	await views.getByRole('link', {name: t('view_app')}).click()
	await page.waitForURL(
		(url) =>
			address(url).pathname === '/@alice.test/apps/enform.test' &&
			address(url).searchParams.get('type') === 'test.enform.note'
	)
	await views.getByRole('link', {name: t('view_data')}).click()
	await page.waitForURL((url) => address(url).pathname === '/@alice.test/test.enform.note')
})
