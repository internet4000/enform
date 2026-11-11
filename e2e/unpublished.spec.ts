/**
 * A record whose type has no published lexicon is still shown, from its values: its
 * title, its words and its link, as its card shows it, in its rendered view too
 */
import {account, expect, signIn, t, test} from './fixtures'
import network from './network.json' with {type: 'json'}

test('a record with no lexicon is rendered from its values', async ({page, request}) => {
	const pds = `http://localhost:${network.ports.pds}`
	const {handle, password} = account('alice.test')
	const session = await request.post(`${pds}/xrpc/com.atproto.server.createSession`, {
		data: {identifier: handle, password}
	})
	const {did, accessJwt} = await session.json()
	const title = `Unpublished ${Date.now()}`
	const created = await request.post(`${pds}/xrpc/com.atproto.repo.createRecord`, {
		headers: {authorization: `Bearer ${accessJwt}`},
		data: {
			repo: did,
			collection: 'test.unpublished.track',
			validate: false,
			record: {
				$type: 'test.unpublished.track',
				title,
				description: 'A track, its type known by no lexicon',
				url: 'https://example.com/track',
				createdAt: new Date().toISOString()
			}
		}
	})
	expect(created.ok()).toBeTruthy()
	const rkey = String((await created.json()).uri)
		.split('/')
		.pop()

	await signIn(page, 'alice.test')
	await page.goto(`/@alice.test/apps/unpublished.test?type=test.unpublished.track&record=${rkey}`)
	const sheet = page.locator('enform-sheet')
	await expect(sheet.getByRole('button', {name: t('view_rendered')})).toHaveAttribute(
		'aria-pressed',
		'true'
	)
	const rendered = sheet.locator('enform-kind-view')
	await expect(rendered.getByRole('heading', {name: title})).toBeVisible()
	await expect(rendered.getByText('A track, its type known by no lexicon')).toBeVisible()
	await expect(rendered.getByRole('link', {name: /example\.com/})).toBeVisible()
})
