/**
 * What a record points at, wherever in it (a reply's root and parent, a quote): shown
 * in its rendered view, before it, as the records themselves
 */
import {account, expect, signIn, test} from './fixtures'
import network from './network.json' with {type: 'json'}

test('a reply shows the post it answers, once when root and parent are one', async ({
	page,
	request
}) => {
	const pds = `http://localhost:${network.ports.pds}`
	const {handle, password} = account('alice.test')
	const session = await request.post(`${pds}/xrpc/com.atproto.server.createSession`, {
		data: {identifier: handle, password}
	})
	const {did, accessJwt} = await session.json()
	const create = async (record: Record<string, unknown>) => {
		const created = await request.post(`${pds}/xrpc/com.atproto.repo.createRecord`, {
			headers: {authorization: `Bearer ${accessJwt}`},
			data: {
				repo: did,
				collection: 'test.enform.note',
				validate: false,
				record: {$type: 'test.enform.note', createdAt: new Date().toISOString(), ...record}
			}
		})
		expect(created.ok()).toBeTruthy()
		return (await created.json()) as {uri: string; cid: string}
	}
	const asked = `Asked ${Date.now()}`
	const first = await create({text: asked})
	const reply = await create({text: 'Answered', reply: {root: first, parent: first}})

	await signIn(page, 'alice.test')
	const rkey = reply.uri.split('/').pop()
	await page.goto(`/@alice.test/apps/enform.test?type=test.enform.note&record=${rkey}`)
	const view = page.locator('enform-sheet enform-kind-view')
	const link = view.locator('section[data-link]')
	await expect(link).toHaveCount(1)
	await expect(link.getByRole('heading')).toHaveText('Reply › Root, Reply › Parent')
	await expect(link.getByText(asked)).toBeVisible()
	await expect(view.getByText('Answered')).toBeVisible()
})
