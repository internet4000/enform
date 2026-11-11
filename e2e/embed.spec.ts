/**
 * <enform-embed> on someone's page (docs/embed.md): a profile's home in an app, read from
 * the repo's own PDS, its records linking to enform, and the reader to read them there
 */
import {account, expect, t, test} from './fixtures'
import network from './network.json' with {type: 'json'}

test("a profile's home in an app, on any page", async ({page, context, request, baseURL}) => {
	const pds = `http://localhost:${network.ports.pds}`
	const {handle, password} = account('alice.test')
	const session = await request.post(`${pds}/xrpc/com.atproto.server.createSession`, {
		data: {identifier: handle, password}
	})
	const {did, accessJwt} = await session.json()
	const text = `Embedded ${Date.now()}`
	const created = await request.post(`${pds}/xrpc/com.atproto.repo.createRecord`, {
		headers: {authorization: `Bearer ${accessJwt}`},
		data: {
			repo: did,
			collection: 'test.enform.note',
			record: {$type: 'test.enform.note', text, createdAt: new Date().toISOString()}
		}
	})
	expect(created.ok()).toBeTruthy()

	// The embed's e2e build (the preview server serves the app's own, and dist/ for the rest)
	await page.route(`${baseURL}/enform-embed.js`, (route) =>
		route.fulfill({path: 'dist-e2e/enform-embed.js', contentType: 'text/javascript'})
	)
	// Someone's page: the module, and the element. Chrome asks before a page reaches the
	// local network (here, the test network): granted, as a visitor would
	await context.grantPermissions(['local-network-access'])
	await page.route(`${baseURL}/someones-page.html`, (route) =>
		route.fulfill({
			contentType: 'text/html',
			body: `<!doctype html><title>Someone's page</title>
				<script type="module" src="/enform-embed.js"></script>
				<enform-embed actor="alice.test" app="enform.test"></enform-embed>`
		})
	)
	await page.goto('/someones-page.html')

	const embed = page.locator('enform-embed')
	await expect(embed.getByRole('heading', {name: /alice\.test/})).toBeVisible()
	const shelf = embed.locator('enform-type-shelf').filter({hasText: text})
	await expect(shelf).toBeVisible()
	// Its records link to their pages in enform
	await expect(shelf.getByRole('link', {name: text})).toHaveAttribute(
		'href',
		new RegExp(`/@alice\\.test/apps/enform\\.test\\?type=test\\.enform\\.note&record=`)
	)
	// Read there, in the reader
	await shelf.getByRole('button', {name: t('reader_read_all')}).click()
	await expect(embed.locator('enform-reader')).toBeVisible()
	// Nothing to edit, nothing to sign in to
	await expect(embed.getByRole('button', {name: /^\+ /})).toHaveCount(0)
})

test("a profile's page says how to embed it", async ({page, context}) => {
	await context.grantPermissions(['clipboard-read', 'clipboard-write'])
	await page.goto('/@alice.test/apps/enform.test')
	await page
		.locator('enform-app-screen > header')
		.getByRole('button', {name: t('record_menu')})
		.click()
	await page.getByRole('button', {name: t('embed_menu')}).click()
	const dialog = page.getByRole('dialog', {name: t('embed_title')})
	const snippet = dialog.locator('pre')
	await expect(snippet).toContainText('<enform-embed actor="alice.test" app="enform.test"')
	await expect(snippet).toContainText('cdn.jsdelivr.net/npm/@internet4000/enform@')
	// Copied from a local instance (here, the tests'), it links to enform's own
	await expect(snippet).not.toContainText('enform="')
	await dialog.getByRole('button', {name: t('embed_copy')}).click()
	await expect(dialog.getByRole('button', {name: t('embed_copied')})).toBeVisible()
	expect(await page.evaluate(() => navigator.clipboard.readText())).toContain('<enform-embed')
})

test('without an app, all of theirs, each opened in place', async ({
	page,
	context,
	request,
	baseURL
}) => {
	const pds = `http://localhost:${network.ports.pds}`
	const {handle, password} = account('alice.test')
	const session = await request.post(`${pds}/xrpc/com.atproto.server.createSession`, {
		data: {identifier: handle, password}
	})
	const {did, accessJwt} = await session.json()
	const text = `Everywhere ${Date.now()}`
	await request.post(`${pds}/xrpc/com.atproto.repo.createRecord`, {
		headers: {authorization: `Bearer ${accessJwt}`},
		data: {
			repo: did,
			collection: 'test.enform.note',
			record: {$type: 'test.enform.note', text, createdAt: new Date().toISOString()}
		}
	})

	await page.route(`${baseURL}/enform-embed.js`, (route) =>
		route.fulfill({path: 'dist-e2e/enform-embed.js', contentType: 'text/javascript'})
	)
	await context.grantPermissions(['local-network-access'])
	await page.route(`${baseURL}/someones-page.html`, (route) =>
		route.fulfill({
			contentType: 'text/html',
			body: `<!doctype html><title>Someone's page</title>
				<script type="module" src="/enform-embed.js"></script>
				<enform-embed actor="alice.test"></enform-embed>`
		})
	)
	await page.goto('/someones-page.html')

	const embed = page.locator('enform-embed')
	const apps = embed.locator('enform-launcher')
	await apps.getByRole('link', {name: /enform\.test/}).click()
	// Opened here, not in enform
	await expect(page).toHaveURL(/someones-page\.html$/)
	await expect(embed.locator('enform-type-shelf').filter({hasText: text})).toBeVisible()
	await embed.getByRole('button', {name: new RegExp(t('embed_all_apps'))}).click()
	await expect(apps.getByRole('link', {name: /enform\.test/})).toBeVisible()
})

test("a person's page says how to embed all their apps", async ({page}) => {
	await page.goto('/@alice.test')
	await page.getByRole('button', {name: t('embed_menu')}).click()
	const snippet = page.getByRole('dialog', {name: t('embed_title')}).locator('pre')
	await expect(snippet).toContainText('<enform-embed actor="alice.test">')
	await expect(snippet).not.toContainText('app="')
})
