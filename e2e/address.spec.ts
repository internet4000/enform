/** Addresses are after `#`, never sent to the host; links from before still open */
import {expect, t, test} from './fixtures'

test('a link from before opens at its address after #', async ({page}) => {
	await page.goto('/@alice.test/apps/enform.test?type=test.enform.note')
	await expect(page).toHaveURL(/\/#\/@alice\.test\/apps\/enform\.test\?type=test\.enform\.note$/)
	await expect(page.getByRole('link', {name: '@alice.test'}).first()).toBeVisible()

	await page.goto('/settings')
	await expect(page).toHaveURL(/\/#\/settings$/)
	await expect(page.getByRole('heading', {name: t('nav_settings')})).toBeVisible()
})
