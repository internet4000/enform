#!/usr/bin/env bun
/**
 * enform's description engine in a terminal (docs/cli.md): what enform makes of a record
 * type (its kind, its fields' roles, how many an account has, what it points at), and
 * why, for any lexicon, file of lexicons or records, repo's collection, or example app.
 * The same code as the app (src/lib/describe); it reads as atproto specifies, writes
 * nothing.
 *
 *   enform describe <target…> [--json]   a type: an NSID, a lexicon or records file,
 *                                        a folder, or at://<repo>/<collection>
 *   enform check <target…> [--json]      the same, and what can't be inferred: exits 1
 *   enform examples                      the example apps and their types
 */
import {readdir, readFile, stat} from 'node:fs/promises'
import {join} from 'node:path'
import {AtUri, NSID} from '@atproto/syntax'
import {describeType, type Sample, type TypeDescription} from '#lib/describe/type'
import {exampleLexicons, exampleNamespaces, exampleTypes} from '#lib/lexicons/examples/index'
import {resolveLexicon} from '#lib/lexicons/resolve'
import type {LexiconDoc} from '#lib/lexicons/types'
import {resolveIdentity} from '#lib/atproto/identity'
import {xrpcGet} from '#lib/atproto/xrpc'

/** Records read to describe a type with no lexicon */
const SAMPLE = 25

type Described = TypeDescription & {from: string}

/** Every type a target names: an NSID, a file, a folder, a repo's collection */
async function describe(target: string): Promise<Described[]> {
	if (target.startsWith('at://')) return [await fromRepo(target)]
	const found = await stat(target).catch(() => undefined)
	if (found?.isDirectory()) {
		const files = (await readdir(target)).filter((name) => name.endsWith('.json')).sort()
		return (await Promise.all(files.map((name) => describe(join(target, name))))).flat()
	}
	if (found?.isFile()) return [fromFile(target, JSON.parse(await readFile(target, 'utf8')))]
	if (NSID.isValid(target)) {
		const lexicon = await resolveLexicon(target).catch(() => undefined)
		return [{...describeType(target, {lexicon}), from: lexicon ? 'lexicon' : 'nothing found'}]
	}
	throw new Error(`Not an NSID, a file, a folder or an at:// URI: ${target}`)
}

/** A lexicon file, or a file of sample records ([{rkey, value}] or listRecords' answer) */
function fromFile(path: string, json: unknown): Described {
	const doc = json as LexiconDoc
	if (doc?.lexicon === 1 && typeof doc.id === 'string') {
		return {...describeType(doc.id, {lexicon: doc}), from: path}
	}
	const list = Array.isArray(json) ? json : ((json as {records?: unknown[]}).records ?? [])
	const samples = list.map(toSample).filter((sample) => sample !== undefined)
	const nsid = String(
		samples[0]?.value.$type ??
			path
				.split('/')
				.pop()
				?.replace(/\.json$/, '')
	)
	return {...describeType(nsid, {samples}), from: path}
}

function toSample(item: unknown): Sample | undefined {
	const record = item as {rkey?: string; uri?: string; value?: Record<string, unknown>}
	if (!record?.value) return undefined
	const rkey = record.rkey ?? (record.uri ? new AtUri(record.uri).rkey : '')
	return {rkey, value: record.value}
}

/** A repo's collection: its lexicon when published, else its first records */
async function fromRepo(uri: string): Promise<Described> {
	const at = new AtUri(uri)
	const nsid = at.collection
	if (!nsid) throw new Error(`Name a collection: at://${at.host}/<collection>`)
	const lexicon = await resolveLexicon(nsid).catch(() => undefined)
	if (lexicon) return {...describeType(nsid, {lexicon}), from: 'lexicon'}
	const repo = await resolveIdentity(at.host)
	const page = await xrpcGet<{records: {uri: string; value: Record<string, unknown>}[]}>(
		repo.pds,
		'com.atproto.repo.listRecords',
		{repo: repo.did, collection: nsid, limit: SAMPLE}
	)
	const samples = page.records.map(toSample).filter((sample) => sample !== undefined)
	return {...describeType(nsid, {samples}), from: `${samples.length} records of ${uri}`}
}

/** What can't be inferred: nothing telling, or nothing to show as its title */
export function gaps(type: TypeDescription): string[] {
	const found: string[] = []
	if (type.source === 'none') found.push('no lexicon and no records')
	if (type.kind === 'thing' && !type.roles.title)
		found.push('kind: nothing telling (no title, text, link, picture…)')
	const {title, text, url, value, subject, image} = type.roles
	if (type.kind !== 'thing' && !(title || text || url || value || subject || image)) {
		found.push('nothing to show it by (no title, text, link or value)')
	}
	return found
}

function print(type: Described, check: boolean) {
	const reason = (about: string) =>
		type.why
			.filter((one) => one.about === about)
			.map((one) => `${one.rule}${one.fields.length ? `: ${one.fields.join(', ')}` : ''}`)
			.join('; ')
	const lines = [
		`${type.nsid}  ${type.kind}  (${type.source}, from ${type.from})`,
		`  kind    ${type.kind.padEnd(12)} ${reason('kind')}`
	]
	if (type.count) lines.push(`  count   ${type.count.padEnd(12)} ${reason('count')}`)
	for (const [role, field] of Object.entries(type.roles)) {
		if (field) lines.push(`  ${role.padEnd(7)} ${field.padEnd(12)} ${reason(role)}`)
	}
	const {accounts, records} = type.points
	if (accounts.length) lines.push(`  points  accounts: ${accounts.join(', ')}`)
	if (records.length) lines.push(`  points  records: ${records.join(', ')}`)
	if (check) for (const gap of gaps(type)) lines.push(`  gap     ${gap}`)
	console.log(lines.join('\n') + '\n')
}

async function main(argv: string[]) {
	const [command, ...rest] = argv
	const json = rest.includes('--json')
	const targets = rest.filter((arg) => arg !== '--json')
	if (command === 'examples') {
		for (const namespace of exampleNamespaces) {
			const domain = namespace.split('.').reverse().join('.')
			console.log(
				`${domain}\n${exampleTypes(namespace)
					.map((doc) => `  ${doc.id}`)
					.join('\n')}`
			)
		}
		return 0
	}
	if ((command !== 'describe' && command !== 'check') || !targets.length) {
		console.error(
			'enform describe <target…> [--json]\nenform check <target…> [--json]\nenform examples\n\n' +
				'A target: an NSID, a lexicon or records file (.json), a folder of them,\n' +
				'at://<repo>/<collection>, or `examples` (every example app).'
		)
		return 2
	}
	const expanded = targets.flatMap((target) =>
		target === 'examples' ? exampleLexicons.map((doc) => doc.id) : [target]
	)
	const types = (await Promise.all(expanded.map(describe))).flat()
	const check = command === 'check'
	if (json) {
		const out = types.map((type) => (check ? {...type, gaps: gaps(type)} : type))
		console.log(JSON.stringify(out, null, '\t'))
	} else {
		for (const type of types) print(type, check)
	}
	const failing = check ? types.filter((type) => gaps(type).length) : []
	if (check && !json) {
		console.log(
			failing.length
				? `${failing.length} of ${types.length} types with gaps`
				: `${types.length} types, no gaps`
		)
	}
	return failing.length ? 1 : 0
}

if (import.meta.main) {
	main(process.argv.slice(2)).then(
		(code) => process.exit(code),
		(error: Error) => {
			console.error(error.message)
			process.exit(2)
		}
	)
}

export {main}
