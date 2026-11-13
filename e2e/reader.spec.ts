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
