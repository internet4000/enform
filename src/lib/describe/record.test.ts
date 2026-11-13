import {expect, test} from 'vitest'
import {exampleLexicon} from '#lib/lexicons/examples'
import {recordLinks, recordRest} from './record'

const pasta = {
	$type: 'example.recipe.recipe',
	title: 'Pasta',
	description: 'normal default pasta',
	ingredients: ['Pasta', 'Water', 'Salt', 'oil or butter'],
	steps: [
		'Boil the water',
		'when the water is boiling, put the pasta.\nstir the pasta as they cook, so they do not stick.',
		'add oil or butter'
	],
	createdAt: '2026-11-12T10:23:00.132Z'
}

test('a recipe: its ingredients listed, its steps numbered; title, text and stamp left to its kind', () => {
	const rest = recordRest(pasta, exampleLexicon('example.recipe.recipe'))
	expect(rest).toEqual([
		{field: 'ingredients', as: 'list', items: pasta.ingredients, ordered: false},
		{field: 'steps', as: 'list', items: pasta.steps, ordered: true}
	])
})

test('without a lexicon, the same from its values', () => {
	const rest = recordRest({...pasta, servings: 2, vegan: true})
	expect(rest.map((part) => [part.field, part.as])).toEqual([
		['ingredients', 'list'],
		['steps', 'list'],
		['servings', 'fact'],
		['vegan', 'fact']
	])
})

test('a reply points at its thread: root and parent, once when they are one record', () => {
	const parent = {cid: 'b1', uri: 'at://did:plc:a/app.bsky.feed.post/3p'}
	const one = recordLinks({text: 'Thanks', reply: {root: parent, parent}})
	expect(one).toEqual([
		{
			uri: parent.uri,
			cid: 'b1',
			paths: [
				['reply', 'root'],
				['reply', 'parent']
			]
		}
	])
	const root = {cid: 'b0', uri: 'at://did:plc:a/app.bsky.feed.post/3r'}
	expect(recordLinks({reply: {root, parent}}).map((link) => link.paths)).toEqual([
		[['reply', 'root']],
		[['reply', 'parent']]
	])
	// A quote, in an embed; an at:// URI as a string; not a repo's or a collection's
	expect(
		recordLinks({
			embed: {$type: 'app.bsky.embed.record', record: root},
			list: 'at://did:plc:a/app.bsky.graph.list/3l',
			repo: 'at://did:plc:a'
		}).map((link) => link.paths)
	).toEqual([[['embed', 'record']], [['list']]])
})
