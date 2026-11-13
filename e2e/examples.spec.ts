/**
 * Every type of every example app (src/lib/lexicons/examples), generated from its lexicon
 * alone, on this device: its form filled from its fields' types (no code per type), the
 * record shown rendered (never empty), edited, deleted. A type enform handles badly
 * fails here (docs/examples.md).
 */
import type {Page} from '@playwright/test'
import {address, closed, creating, expect, opened, t, test} from './fixtures'
import network from './network.json' with {type: 'json'}
import type {LexiconDoc, LexNode} from '../src/lib/lexicons/types'
import {exampleLexicons} from '../src/lib/lexicons/examples/index'
import {describeType} from '../src/lib/describe/type'

const domainOf = (nsid: string) => nsid.split('.').slice(0, 2).reverse().join('.')

/** The local profile's handle, once started on this device */
async function startOnDevice(page: Page, nsid: string) {
	await page.goto(`/apps/${domainOf(nsid)}`)
	await page.getByRole('button', {name: t('start_device_button')}).click()
	await page.waitForURL(creating)
	return address(page.url()).pathname.split('/')[1].slice(1)
}

/** A value for each required field, and each the engine says carries the type (its title,
    text…), from its type alone */
async function fill(page: Page, doc: LexiconDoc, refs: {account: string; record?: string}) {
	const record = doc.defs.main.record!
	// Its telling fields: not its date, which stamps itself
	const {date: _, ...roles} = describeType(doc.id, {lexicon: doc}).roles
	const telling = Object.values(roles)
	const form = page.locator('enform-form')
	for (const [key, node] of Object.entries(record.properties ?? {}) as [string, LexNode][]) {
		if (!record.required?.includes(key) && !(telling.includes(key) && node.type === 'string'))
			continue
		const control = form.locator(`[id$="-${key}"]`).first()
		if (node.type === 'string' && node.format === 'datetime') {
			// Made-at stamps fill themselves; a date of its own is given
			if (!(await control.inputValue())) await control.fill('2026-12-01T20:00')
		} else if (node.type === 'string' && node.format === 'uri') {
			await control.fill(`https://example.com/${key}`)
		} else if (node.type === 'string' && node.format === 'did') {
			await control.fill(refs.account)
		} else if (node.type === 'string' && node.maxGraphemes === 1) {
			await control.fill('🙂')
		} else if (node.type === 'string' && node.knownValues) {
			await control.fill(node.knownValues[0])
		} else if (node.type === 'string') {
			await control.fill(`${key} of ${doc.id}`)
		} else if (node.type === 'ref' && /strongRef/.test(node.ref ?? '') && refs.record) {
			await control.fill(refs.record)
			await control.blur()
			await expect(form.getByText(t('form_strongref_found'))).toBeVisible()
		} else {
			throw new Error(`No value for ${doc.id}#${key} (${node.type})`)
		}
	}
	await form.locator('button[type="submit"]', {hasText: t('new_submit')}).click()
	await page.waitForURL(opened)
	return address(page.url()).searchParams.get('record')!
}

/** Creates one record of a type, from its app's screen */
async function create(
	page: Page,
	handle: string,
	doc: LexiconDoc,
	refs: {account: string; record?: string}
) {
	await page.goto(`/@${handle}/apps/${domainOf(doc.id)}?type=${doc.id}&new`)
	await page.waitForURL(creating)
	return fill(page, doc, refs)
}

for (const doc of exampleLexicons) {
	test(`${doc.id}: create, read, edit and delete, from its lexicon alone`, async ({
		page,
		request
	}) => {
		// An account to point at: one of the local network's
		const resolved = await request.get(
			`http://localhost:${network.ports.pds}/xrpc/com.atproto.identity.resolveHandle?handle=alice.test`
		)
		const account = (await resolved.json()).did as string
		const handle = await startOnDevice(page, doc.id)

		// What it points at, made first (an answer needs its event)
		const target = Object.values(doc.defs.main.record?.properties ?? {}).some(
			(node) => node.type === 'ref' && /strongRef/.test(node.ref ?? '')
		)
			? exampleLexicons.find((other) => other.id === 'example.event.event')!
			: undefined
		const record = target
			? `at://${handle}/${target.id}/${await create(page, handle, target, {account})}`
			: undefined

		await create(page, handle, doc, {account, record})
		const sheet = page.locator('enform-sheet')
		await expect(sheet.getByRole('button', {name: t('view_rendered')})).toHaveAttribute(
			'aria-current',
			'true'
		)
		await expect(sheet.locator('enform-kind-view')).not.toBeEmpty()
		const recordUrl = page.url()

		// Edited: its form again, saved as it is
		await page.goto(`${recordUrl}&edit`)
		await page.getByRole('button', {name: t('edit_submit')}).click()
		await page.waitForURL((url) => url.href === recordUrl)

		// Deleted, confirmed
		await sheet
			.getByRole('button', {name: t('record_delete'), exact: true})
			.first()
			.click()
		await page
			.getByRole('dialog', {name: t('record_delete_confirm_title')})
			.getByRole('button', {name: t('record_delete')})
			.click()
		await page.waitForURL(closed)
	})
}

test('an event is answered: its RSVP starts pointing at it, and picks among yours', async ({
	page
}) => {
	const event = exampleLexicons.find((doc) => doc.id === 'example.event.event')!
	const handle = await startOnDevice(page, event.id)
	await fill(page, event, {account: ''})
	const sheet = page.locator('enform-sheet')
	await sheet.getByRole('button', {name: t('answer_with', {type: 'Rsvp'})}).click()
	await page.waitForURL(
		(url) => creating(url) && address(url).searchParams.get('type') === 'example.event.rsvp'
	)
	const form = page.locator('enform-form')
	// Already set to the event, said why, and the event is among yours to pick
	await expect(form.getByText(t('form_strongref_found'))).toBeVisible()
	await expect(form.getByText(`name of ${event.id}`).first()).toBeVisible()
	await expect(form.getByRole('button', {name: `name of ${event.id}`})).toHaveAttribute(
		'aria-pressed',
		'true'
	)
	await expect(
		form.getByText(
			t('form_strongref_points', {
				type: 'Event',
				because: t('references_because_described')
			})
		)
	).toBeVisible()
	await form.locator('[id$="-status"]').first().fill('going')
	await form.locator('button[type="submit"]', {hasText: t('new_submit')}).click()
	await page.waitForURL(opened)
})

test('a recipe shows all it holds: its lists, steps numbered; its card counts them', async ({
	page
}) => {
	const recipe = exampleLexicons.find((doc) => doc.id === 'example.recipe.recipe')!
	const handle = await startOnDevice(page, recipe.id)
	await page.goto(`/@${handle}/apps/${domainOf(recipe.id)}?type=${recipe.id}&new`)
	const form = page.locator('enform-form')
	await form.locator('[id$="-title"]').first().fill('Pasta')
	const lists = {
		ingredients: ['Pasta', 'Water', 'Salt'],
		steps: [
			'Boil the water',
			'When the water is boiling, put the pasta in, and stir it as it cooks'
		]
	}
	for (const [name, items] of Object.entries(lists)) {
		for (const [index, item] of items.entries()) {
			await form.getByRole('button', {name: t('form_array_add', {name})}).click()
			await form.locator(`[id$="-${name}-${index}"]`).first().fill(item)
		}
	}
	await form.locator('button[type="submit"]', {hasText: t('new_submit')}).click()
	await page.waitForURL(opened)
	const view = page.locator('enform-sheet enform-kind-view')
	await expect(view.locator('section', {hasText: 'Ingredients'}).locator('ul li')).toHaveCount(3)
	await expect(view.locator('section', {hasText: 'Steps'}).locator('ol li')).toHaveCount(2)
	await page.goto(`/@${handle}/apps/${domainOf(recipe.id)}?type=${recipe.id}`)
	await expect(page.locator('enform-record-card-item', {hasText: 'Pasta'})).toContainText(
		t('card_count', {count: '3', name: 'ingredients'})
	)
})
