/**
 * A place, picked for latitude/longitude fields of any lexicon: by address (the geocoder
 * answered here, offline) or by this device's location (granted to the test)
 */
import {creating, expect, t, test} from './fixtures'

test('pick a place by address, then by location', async ({page, context}) => {
	await context.grantPermissions(['geolocation'])
	await context.setGeolocation({latitude: 48.8566, longitude: 2.3522})
	await page.route('**/nominatim.openstreetmap.org/**', (route) =>
		route.fulfill({json: [{display_name: 'Berlin, Germany', lat: '52.52', lon: '13.405'}]})
	)
	await page.goto('/apps/statusphere.xyz')
	await page.getByRole('button', {name: t('apps_try_local')}).click()
	await page.waitForURL(creating)
	const local = new URL(page.url()).pathname.split('/apps/')[0]
	await page.goto(`${local}/apps/enform.test?type=test.enform.place&new`)

	await page.getByRole('searchbox', {name: t('place_search')}).fill('Berlin')
	await page.getByRole('button', {name: t('place_find')}).click()
	await page.getByRole('button', {name: 'Berlin, Germany'}).click()
	await expect(page.getByRole('textbox', {name: 'Latitude'})).toHaveValue('52.52')
	await expect(page.getByRole('textbox', {name: t('field_name')})).toHaveValue('Berlin, Germany')

	await page.getByRole('button', {name: t('place_here')}).click()
	await expect(page.getByRole('textbox', {name: 'Latitude'})).toHaveValue('48.8566')
	await expect(page.getByRole('textbox', {name: 'Longitude'})).toHaveValue('2.3522')
	await expect(page.locator('enform-map canvas')).toBeVisible()
})
