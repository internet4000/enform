/**
 * The reader: its controls at its foot, as 4000.radio's (previous, next, autoplay; play,
 * progress and volume when a record has media), and its sizes, dragged or moved with the
 * keys, kept for the next visit
 */
import {address, creating, expect, opened, t, test} from './fixtures'

test('the reader keeps the sizes one gives it', async ({page}, info) => {
	// Two notes on this device, to read one after the other
	await page.goto('/new/test.enform.note')
	await page.getByRole('button', {name: t('start_device_button')}).click()
	const form = page.locator('enform-form')
	for (const text of ['One', 'Two']) {
		await page.waitForURL(creating)
		await page.getByRole('textbox', {name: t('field_text'), exact: true}).fill(text)
		await form.getByRole('button', {name: t('new_submit')}).click()
		await page.waitForURL(opened)
		if (text === 'One') await page.goto(`${address(page.url()).pathname}?type=test.enform.note&new`)
	}
	await page.goto(`/#${address(page.url()).pathname}?type=test.enform.note`)
	await page
		.getByRole('button', {name: t('reader_read_all')})
		.first()
		.click()

	const reader = page.getByRole('region', {name: t('reader_label')})
	// Where it plays from: the app, the profile, the type's lexicon
	const from = reader.getByRole('navigation', {name: t('reader_from')})
	await expect(from.getByRole('link', {name: 'enform.test'})).toBeVisible()
	await expect(from.getByRole('link', {name: 'test.enform.note'})).toHaveAttribute(
		'href',
		/lexicon\/test\.enform\.note/
	)
	await expect(reader.getByRole('button', {name: t('reader_next')})).toBeEnabled()
	await expect(reader.getByRole('button', {name: t('reader_autoplay')})).toHaveAttribute(
		'aria-pressed',
		'true'
	)
	// A note has no media: nothing to play
	await expect(reader.getByRole('button', {name: t('reader_play'), exact: true})).toHaveCount(0)

	// Wide screens: the record's share, above what's up next; phones: the reader's height
	const handle =
		info.project.name === 'desktop'
			? reader.getByRole('separator', {name: t('reader_resize_split')})
			: reader.getByRole('separator', {name: t('reader_resize')}).last()
	const record = reader.locator('enform-present')
	const size = async () =>
		info.project.name === 'desktop'
			? (await record.boundingBox())!.height
			: (await reader.boundingBox())!.height
	const before = await size()
	await handle.focus()
	await handle.press('ArrowUp')
	await handle.press('ArrowUp')
	// Up: a smaller record above the list; on phones, the reader's top edge, a taller reader
	if (info.project.name === 'desktop') await expect.poll(size).toBeLessThan(before - 16)
	else await expect.poll(size).toBeGreaterThan(before + 16)
	const after = await size()

	// The next record keeps it, and so does the next visit
	await reader.getByRole('button', {name: t('reader_next')}).click()
	expect(Math.round(await size())).toBe(Math.round(after))
	await page.reload()
	await page
		.getByRole('button', {name: t('reader_read_all')})
		.first()
		.click()
	await expect.poll(async () => Math.round(await size())).toBe(Math.round(after))
})

test('decks stay mounted: the one in front shown, the others still playing', async ({page}) => {
	// A note and a status on this device: two lists, two decks
	await page.goto('/new/test.enform.note')
	await page.getByRole('button', {name: t('start_device_button')}).click()
	await page.waitForURL(creating)
	await page.getByRole('textbox', {name: t('field_text'), exact: true}).fill('A note')
	await page
		.locator('enform-form')
		.getByRole('button', {name: t('new_submit')})
		.click()
	await page.waitForURL(opened)
	const handle = address(page.url()).pathname.split('/')[1]
	await page.goto(`/${handle}/apps/status.example?type=example.status.status&new`)
	await page.waitForURL(creating)
	await page.locator('enform-form [id$="-status"]').first().fill('🙂')
	await page
		.locator('enform-form')
		.getByRole('button', {name: t('new_submit')})
		.click()
	await page.waitForURL(opened)

	const reader = page.getByRole('region', {name: t('reader_label')})
	for (const [type, text] of [
		['test.enform.note', 'A note'],
		['example.status.status', '🙂']
	]) {
		const domain = type.split('.').slice(0, 2).reverse().join('.')
		// By a link, in the app (not a new page load): the reader keeps its decks
		await page.evaluate((hash) => {
			const link = Object.assign(document.createElement('a'), {href: hash, textContent: 'go'})
			document.body.append(link)
			link.click()
			link.remove()
		}, `#/${handle}/apps/${domain}?type=${type}`)
		await page.waitForURL((url) => address(url).searchParams.get('type') === type)
		await expect(page.locator('enform-record-card-item', {hasText: text})).toBeVisible()
		await page
			.getByRole('button', {name: t('reader_read_all')})
			.first()
			.click()
	}
	const decks = reader.getByRole('navigation', {name: t('reader_decks')})
	await expect(decks.locator('button[aria-current]')).toBeVisible()
	await expect(reader.locator('enform-present')).toHaveCount(2)
	await expect(reader.locator('enform-present[hidden]')).toHaveCount(1)
	await expect(reader.locator('enform-present:not([hidden])')).toContainText('🙂')
	// The other deck to the front: the status stays, out of sight
	await decks.locator('li').first().getByRole('button').first().click()
	await expect(reader.locator('enform-present')).toHaveCount(2)
	await expect(reader.locator('enform-present:not([hidden])')).toContainText('A note')
	await expect(reader.locator('enform-present[hidden]')).toContainText('🙂')
})
