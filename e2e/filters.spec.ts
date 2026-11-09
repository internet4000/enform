/**
 * The search field searches where you are: on an app's screen, the records shown, as one
 * types; removed, everywhere. Over the records, the filters their texts and lexicon offer
 * (here, a #tag), in the URL.
 */
import {approvePopup, creating, expect, opened, signIn, t, test} from './fixtures'

test('search in place, filter by a #tag, then search everywhere', async ({page}) => {
	const tag = `t${Date.now()}`
	await signIn(page, 'alice.test')
	// Permission is asked once; the next notes are written with it
	for (const [index, text] of [`Sunrise #${tag}`, `Sunset #${tag}`, `Rain ${tag}`].entries()) {
		await page.goto('/new/test.enform.note')
		await page.waitForURL(creating)
		await page.getByRole('textbox', {name: t('field_text'), exact: true}).fill(text)
		const submit = () => page.getByRole('button', {name: t('new_submit')}).click()
		if (index === 0) await approvePopup(page, 'alice.test', submit)
		else await submit()
		await page.waitForURL(opened)
	}

	await page.goto('/@alice.test/apps/enform.test?type=test.enform.note')
	const grid = page.locator('enform-record-grid')
	await expect(grid.getByText(`Rain ${tag}`)).toBeVisible()

	// In place: the chip says where, the cards narrow as one types
	const search = page.getByRole('searchbox')
	await expect(search).toHaveAttribute('placeholder', t('search_here'))
	await search.fill(`sunrise ${tag}`)
	await expect(grid.getByText(`Sunrise #${tag}`)).toBeVisible()
	await expect(grid.getByText(`Sunset #${tag}`)).toHaveCount(0)
	await expect(page).toHaveURL(/[?&]q=sunrise/)
	await search.fill('')

	// A #tag written in two of them: a filter
	await page
		.getByRole('group', {name: t('filter_title')})
		.getByRole('link', {name: new RegExp(`#${tag}`)})
		.click()
	await expect(grid.getByText(`Sunset #${tag}`)).toBeVisible()
	await expect(grid.getByText(`Rain ${tag}`)).toHaveCount(0)
	await page
		.getByRole('link', {name: t('filter_clear')})
		.first()
		.click()
	await expect(grid.getByText(`Rain ${tag}`)).toBeVisible()

	// Removing the chip: the same field searches everywhere
	await page.locator('form[role=search] button').click()
	await expect(search).toHaveAttribute('placeholder', t('search_placeholder'))
	await search.fill('alice.test')
	await search.press('Enter')
	await page.waitForURL((url) => url.pathname === '/search')
})
