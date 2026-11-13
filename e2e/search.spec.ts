import {address, expect, signIn, t, test} from './fixtures'

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

test('Settings opens from the main menu; old More links still land', async ({page}) => {
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

test('the main menu: New picks a type to create, Profile is your repo', async ({page}) => {
	await signIn(page, 'alice.test')
	await page.goto('/')
	const nav = page.getByRole('navigation', {name: t('nav_main')})
	await nav.getByRole('link', {name: t('nav_new')}).click()
	await page.waitForURL((url) => address(url).pathname === '/new')
	await expect(page.getByRole('heading', {level: 1, name: t('new_title')})).toBeVisible()
	await nav.getByRole('link', {name: t('nav_profile')}).click()
	await page.waitForURL((url) => address(url).pathname === '/@alice.test')
})
