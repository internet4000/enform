import {expect, t, test} from './fixtures'

test('search from the top: someone by handle, then their page', async ({page}) => {
	await page.goto('/')
	const search = page.getByRole('searchbox', {name: t('search_label')})
	await search.fill('alice.test')
	await search.press('Enter')
	await page.waitForURL((url) => url.pathname === '/search')
	await expect(page.getByRole('heading', {name: t('search_people')})).toBeVisible()
	await page
		.getByRole('link', {name: /alice\.test/})
		.first()
		.click()
	await page.waitForURL((url) => url.pathname === '/@alice.test')
})

test('settings moved to More, old links still land', async ({page}) => {
	await page.goto('/settings')
	await page.waitForURL((url) => url.pathname === '/more')
	await expect(page.getByRole('heading', {level: 1, name: t('nav_more')})).toBeVisible()
})
