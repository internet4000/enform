/**
 * Form patterns from lexicon shapes, against the local PDS: a text's links, #tags and
 * @mentions become facets; a dropped image is uploaded, fills its aspect ratio and asks
 * for its alt text
 */
import {approvePopup, expect, signIn, t, test} from './fixtures'

const NSID = 'test.enform.photo'

test('a photo: facets from its text, and an image with its size and alt', async ({page}) => {
	await signIn(page, 'alice.test')
	await page.goto(`/new/${NSID}`)
	await page.waitForURL(`**/@alice.test/${NSID}?new`)

	// Rich text: chips for what will be linked
	await page.getByRole('textbox', {name: 'text', exact: true}).fill('New #photo for @bob.test')
	await expect(page.locator('enform-facets data')).toHaveText(['#photo', '@bob.test'])

	// An image, dropped on its field: uploaded (asking permission), then its size and alt
	const drop = page.evaluateHandle(async () => {
		const canvas = Object.assign(document.createElement('canvas'), {width: 30, height: 20})
		const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, 'image/png'))
		const transfer = new DataTransfer()
		transfer.items.add(new File([blob as Blob], 'photo.png', {type: 'image/png'}))
		return transfer
	})
	await approvePopup(page, 'alice.test', async () => {
		await page.locator('enform-blob').dispatchEvent('drop', {dataTransfer: await drop})
	})
	await expect(page.getByRole('spinbutton', {name: 'width'})).toHaveValue('30')
	await expect(page.getByRole('spinbutton', {name: 'height'})).toHaveValue('20')
	const alt = page.getByRole('textbox', {name: /^alt/})
	await expect(alt).toBeFocused()
	await alt.fill('A blank test image')

	await approvePopup(page, 'alice.test', () =>
		page.getByRole('button', {name: t('new_submit')}).click()
	)
	await page.waitForURL((url) => url.pathname.startsWith(`/@alice.test/${NSID}/`) && !url.search)

	// The record as written: facets with byte ranges, the image, its size and alt
	await page
		.locator('details')
		.filter({hasText: t('record_raw')})
		.locator('summary')
		.click()
	const record = JSON.parse(await page.locator('details pre').innerText()).value
	expect(
		record.facets.map((facet: {features: {$type: string}[]}) => facet.features[0].$type)
	).toEqual(['app.bsky.richtext.facet#tag', 'app.bsky.richtext.facet#mention'])
	expect(record.facets[0].index).toEqual({byteStart: 4, byteEnd: 10})
	expect(record.image.mimeType).toBe('image/png')
	expect(record.aspectRatio).toEqual({width: 30, height: 20})
	expect(record.alt).toBe('A blank test image')
})
