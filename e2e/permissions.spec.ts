/**
 * Never more permission than the action at hand: what each authorization request asks
 * the PDS for (its pushed request's `scope`), not the list the client declares. Signing
 * in asks for the identity alone; a first write, for that write's action alone.
 */
import type {Request} from '@playwright/test'
import {approvePopup, creating, expect, opened, signIn, t, test} from './fixtures'

const NSID = 'test.enform.note'

/** The scopes asked for in a pushed authorization request, else undefined */
function asked(request: Request): string[] | undefined {
	if (request.method() !== 'POST' || !new URL(request.url()).pathname.endsWith('/oauth/par'))
		return undefined
	const scope = new URLSearchParams(request.postData() ?? '').get('scope')
	return scope?.split(' ').sort()
}

test('sign-in asks for the identity alone, a first write for its action alone', async ({
	page,
	context
}, info) => {
	const requests: string[][] = []
	// Accepted ones only: the first of each is refused for a DPoP nonce, then sent again
	context.on('requestfinished', async (request) => {
		const scopes = asked(request)
		if (scopes && (await request.response())?.ok()) requests.push(scopes)
	})

	await signIn(page, 'alice.test')
	expect(requests).toEqual([['atproto']])

	// Creating: create, on this collection (not declared, so all collections), nothing else
	await page.goto(`/new/${NSID}`)
	await page.waitForURL(creating)
	await page
		.getByRole('textbox', {name: t('field_text'), exact: true})
		.fill(`Permissions ${info.project.name} ${Date.now()}`)
	await approvePopup(page, 'alice.test', () =>
		page.getByRole('button', {name: t('new_submit')}).click()
	)
	await page.waitForURL(opened)
	expect(requests).toHaveLength(2)
	expect(requests[1]).toEqual(['atproto', 'repo:*?action=create'])
	expect(requests.flat().some((scope) => /action=(update|delete)|^blob:/.test(scope))).toBe(false)
})
