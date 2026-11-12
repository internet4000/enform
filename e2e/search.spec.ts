import {address, expect, t, test} from './fixtures'

test('search from the top: someone by handle, then their page', async ({page}) => {
	await page.goto('/')
	const search = page.getByRole('searchbox', {name: t('search_label')})
	await search.fill('alice.test')
	await search.press('Enter')
	await page.waitForURL((url) => address(url).pathname === '/search')
	await expect(page.getByRole('heading', {name: t('search_people')})).toBeVisible()
	await page
		.getByRole('link', {name: /alice\.test/})
		.first()
		.click()
	await page.waitForURL((url) => address(url).pathname === '/@alice.test')
})

test('Settings opens from who you are; old More links still land', async ({page}) => {
	await page.goto('/more')
	await page.waitForURL((url) => address(url).pathname === '/settings')
	await expect(page.getByRole('heading', {level: 1, name: t('nav_settings')})).toBeVisible()
	await page.goto('/')
	await page
		.getByRole('navigation', {name: t('nav_main')})
		.getByRole('link', {name: t('nav_settings')})
		.click()
	await page.waitForURL((url) => address(url).pathname === '/settings')
})
