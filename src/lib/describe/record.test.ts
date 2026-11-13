import {expect, test} from 'vitest'
import {exampleLexicon} from '#lib/lexicons/examples'
import {recordRest} from './record'

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
