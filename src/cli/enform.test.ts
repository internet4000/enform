import {mkdtemp, writeFile} from 'node:fs/promises'
import {tmpdir} from 'node:os'
import {join} from 'node:path'
import {afterEach, expect, test, vi} from 'vitest'
import {main} from './enform'

const out = vi.spyOn(console, 'log').mockImplementation(() => {})
afterEach(() => out.mockClear())
const printed = () => out.mock.calls.map((call) => call.join(' ')).join('\n')

test('checks every example app: no gaps', async () => {
	expect(await main(['check', 'examples'])).toBe(0)
	expect(printed()).toContain('example.note.entry  post')
	expect(printed()).toMatch(/11 types, no gaps/)
})

test('describes a folder of lexicon and records files, and says what is missing', async () => {
	const folder = await mkdtemp(join(tmpdir(), 'enform-cli-'))
	const lexicon = {
		lexicon: 1,
		id: 'test.cli.thing',
		defs: {
			main: {
				type: 'record',
				key: 'tid',
				record: {type: 'object', properties: {n: {type: 'integer'}}}
			}
		}
	}
	await writeFile(join(folder, 'thing.json'), JSON.stringify(lexicon))
	await writeFile(
		join(folder, 'tracks.json'),
		JSON.stringify([
			{
				rkey: '1763711883563',
				value: {$type: 'test.cli.track', title: 'A', url: 'https://example.com/a'}
			}
		])
	)
	expect(await main(['check', folder])).toBe(1)
	expect(printed()).toContain('test.cli.thing  thing')
	expect(printed()).toContain('gap     kind: nothing telling')
	expect(printed()).toContain('test.cli.track  link  (records')
	expect(printed()).toContain('records-keyed-numbers')
})

test('describes as JSON, with the reasons', async () => {
	expect(await main(['describe', 'example.status.status', '--json'])).toBe(0)
	const [type] = JSON.parse(printed())
	expect(type).toMatchObject({
		nsid: 'example.status.status',
		kind: 'status',
		roles: {value: 'status'}
	})
	expect(type.why[0]).toEqual({about: 'kind', rule: 'one-short-value', fields: ['status']})
})
