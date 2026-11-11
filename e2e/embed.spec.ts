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
