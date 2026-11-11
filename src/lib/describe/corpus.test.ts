/**
 * The description engine on real lexicons (corpus/lexicons, resolved from their
 * publishers) and sample records of types with none (corpus/records, invented values in
 * real shapes). corpus/descriptions.json is what it says of each: reviewed, so any
 * change to the inferences shows as a diff over every app at once.
 */
import {expect, test} from 'vitest'
import type {LexiconDoc} from '#lib/lexicons/types'
import {describeType, type Sample} from './type'

const lexicons = import.meta.glob<LexiconDoc>('./corpus/lexicons/*.json', {
	eager: true,
	import: 'default'
})
const records = import.meta.glob<Sample[]>('./corpus/records/*.json', {
	eager: true,
	import: 'default'
})
const nsidOf = (path: string) =>
	path
		.split('/')
		.pop()!
		.replace(/\.json$/, '')

test('describes every type of the corpus', async () => {
	const described = [
		...Object.entries(lexicons).map(([path, lexicon]) => describeType(nsidOf(path), {lexicon})),
		...Object.entries(records).map(([path, samples]) => describeType(nsidOf(path), {samples}))
	].sort((a, b) => a.nsid.localeCompare(b.nsid))

	const summary = Object.fromEntries(
		described.map(({nsid, kind, count, roles, points, source, why}) => [
			nsid,
			{
				kind,
				because: why.find((reason) => reason.about === 'kind')?.rule,
				count,
				roles: Object.fromEntries(Object.entries(roles).filter(([, field]) => field)),
				points: Object.fromEntries(Object.entries(points).filter(([, list]) => list.length)),
				source
			}
		])
	)
	await expect(JSON.stringify(summary, null, '\t') + '\n').toMatchFileSnapshot(
		'./corpus/descriptions.json'
	)
})
