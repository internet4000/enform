import {address, creating, expect, signIn, t, test} from './fixtures'

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
	await nav.getByRole('link', {name: t('nav_profile')}).click()
	await page.waitForURL((url) => address(url).pathname === '/@alice.test')
	await nav.getByRole('link', {name: t('nav_new')}).click()
	await page.waitForURL((url) => address(url).pathname === '/new')
	await expect(page.getByRole('heading', {level: 1, name: t('new_title')})).toBeVisible()
	await expect(page.getByRole('link', {name: '@alice.test'}).first()).toBeVisible()
	// Any type by its NSID opens its form
	await page.getByRole('searchbox', {name: t('new_find_label')}).fill('test.enform.note')
	await page
		.getByRole('button', {name: t('new_record_title', {collection: 'test.enform.note'})})
		.click()
	await page.waitForURL(creating)
})

test('nobody yet: a type to make, then the two ways to start, signing in back to it', async ({
	page
}) => {
	await page.goto('/new/test.enform.note')
	await expect(page.getByRole('button', {name: t('start_device_button')})).toBeVisible()
	await expect(page.getByRole('button', {name: t('session_sign_in')})).toBeVisible()
	await page.getByRole('button', {name: t('start_device_button')}).click()
	await page.waitForURL(creating)
})
