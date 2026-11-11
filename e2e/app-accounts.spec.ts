/**
 * An app's page shows its own account, as the protocol names it (here: the account
 * publishing its lexicons), with what it has in the app, its first records shown
 */
import {account, expect, t, test} from './fixtures'
import network from './network.json' with {type: 'json'}

test("an app's page shows its own account and its records", async ({page, request}) => {
	const pds = `http://localhost:${network.ports.pds}`
	const {handle, password} = account('statusphere.test')
	const session = await request.post(`${pds}/xrpc/com.atproto.server.createSession`, {
		data: {identifier: handle, password}
	})
	const {did, accessJwt} = await session.json()
	const created = await request.post(`${pds}/xrpc/com.atproto.repo.createRecord`, {
		headers: {authorization: `Bearer ${accessJwt}`},
		data: {
			repo: did,
			collection: 'xyz.statusphere.status',
			record: {
				$type: 'xyz.statusphere.status',
				status: '🦋',
				createdAt: new Date().toISOString()
			}
		}
	})
	expect(created.ok()).toBeTruthy()

	await page.goto('/apps/statusphere.xyz')
	const section = page.getByRole('region', {name: t('apps_accounts_title', {app: 'Statusphere'})})
	await expect(section).toBeVisible()
	await expect(section.getByText(`@${handle}`)).toBeVisible()
	await expect(section.getByText(t('apps_accounts_lexicons'))).toBeVisible()
	await expect(section.getByText('🦋').first()).toBeVisible()

	await section.getByRole('button', {name: t('apps_open_theirs'), exact: true}).click()
	await expect(page).toHaveURL(new RegExp(`/@${handle}/apps/statusphere\\.xyz`))
})
