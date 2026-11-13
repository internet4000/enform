/**
 * A card does what its record is for: a note is read (in the reader, with its list), an
 * RSVP goes to its event; the record itself is in the card's menu, always there
 */
import {address, creating, expect, opened, t, test} from './fixtures'

test('a card reads its note; View record, in its menu, opens it', async ({page}) => {
	await page.goto('/new/test.enform.note')
	await page.getByRole('button', {name: t('start_device_button')}).click()
	await page.waitForURL(creating)
	await page.getByRole('textbox', {name: t('field_text'), exact: true}).fill('A note to read')
	await page
		.locator('enform-form')
		.getByRole('button', {name: t('new_submit')})
		.click()
	await page.waitForURL(opened)
	await page.goto(`/#${address(page.url()).pathname}?type=test.enform.note`)

	const card = page.locator('enform-record-card-item', {hasText: 'A note to read'})
	await expect(card.locator('enform-card-action')).toHaveText(t('action_read'))
	await card.getByRole('button', {name: /^A note to read/}).click()
	await expect(
		page
			.getByRole('region', {name: t('reader_label')})
			.getByText('A note to read')
			.first()
	).toBeVisible()
	await expect(page).not.toHaveURL((url) => opened(url))

	await card.getByRole('button', {name: `${t('record_menu')} · A note to read`}).click()
	await page.getByRole('link', {name: t('action_view_record')}).click()
	await page.waitForURL(opened)
})
