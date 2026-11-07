/** Lexicons for tests, resolved without the network */
import {parseRef} from '#lib/lexicons/refs'
import type {LexiconDoc} from '#lib/lexicons/types'
import type {Resolver} from './types'

export const docs: Record<string, LexiconDoc> = {
	'test.feed.post': {
		lexicon: 1,
		id: 'test.feed.post',
		defs: {
			main: {
				type: 'record',
				key: 'tid',
				record: {
					type: 'object',
					required: ['text', 'createdAt'],
					properties: {
						text: {type: 'string', maxGraphemes: 300},
						createdAt: {type: 'string', format: 'datetime'},
						count: {type: 'integer', minimum: 0},
						tags: {type: 'array', items: {type: 'string'}, maxLength: 2},
						embed: {type: 'union', refs: ['test.embed.images', '#external']},
						reply: {type: 'ref', ref: '#replyRef'},
						purpose: {type: 'ref', ref: '#purpose'},
						extra: {type: 'unknown'}
					}
				}
			},
			replyRef: {
				type: 'object',
				required: ['parent'],
				properties: {parent: {type: 'ref', ref: 'com.atproto.repo.strongRef'}}
			},
			external: {
				type: 'object',
				required: ['uri'],
				properties: {uri: {type: 'string', format: 'uri'}, title: {type: 'string'}}
			},
			purpose: {type: 'string', knownValues: ['test.feed.post#modlist']},
			modlist: {type: 'token'}
		}
	},
	'test.embed.images': {
		lexicon: 1,
		id: 'test.embed.images',
		defs: {
			main: {
				type: 'object',
				required: ['images'],
				properties: {images: {type: 'array', items: {type: 'ref', ref: '#image'}, maxLength: 4}}
			},
			image: {
				type: 'object',
				required: ['image', 'alt'],
				properties: {alt: {type: 'string'}, image: {type: 'blob', accept: ['image/*']}}
			}
		}
	},
	'com.atproto.repo.strongRef': {
		lexicon: 1,
		id: 'com.atproto.repo.strongRef',
		defs: {
			main: {
				type: 'object',
				required: ['uri', 'cid'],
				properties: {
					uri: {type: 'string', format: 'at-uri'},
					cid: {type: 'string', format: 'cid'}
				}
			}
		}
	}
}

export const resolve: Resolver = async (ref, base) => {
	const {nsid, def} = parseRef(ref, base)
	const node = docs[nsid]?.defs[def]
	return node ? {node, nsid} : undefined
}

export const resolveDoc = async (nsid: string): Promise<LexiconDoc> => {
	const doc = docs[nsid]
	if (!doc) throw new Error(`No lexicon ${nsid}`)
	return doc
}

export const post = docs['test.feed.post'].defs.main
