/** Every constraint a whole record breaks, field by field, following refs and unions */
import {resolveRef, unionMember} from '#lib/lexicons/refs'
import type {LexNode} from '#lib/lexicons/types'
import {fieldErrors, isMissing} from './constraints'
import {type PathErrors, type Resolver} from './types'

type Walk = {
	base: string
	path: PathErrors['path']
	required: boolean
	resolve: Resolver
	out: PathErrors[]
}

export async function recordErrors(
	node: LexNode,
	value: unknown,
	base: string,
	resolve: Resolver = resolveRef
): Promise<PathErrors[]> {
	const out: PathErrors[] = []
	await walk(node, value, {base, path: [], required: true, resolve, out})
	return out
}

async function walk(node: LexNode, value: unknown, at: Walk): Promise<void> {
	const errors = fieldErrors(node, value, {required: at.required, base: at.base})
	if (errors.length) at.out.push({path: at.path, errors})
	if (isMissing(value) || errors.length) return
	switch (node.type) {
		case 'record':
			if (node.record) await walk(node.record, value, at)
			return
		case 'object': {
			const object = value as Record<string, unknown>
			for (const [key, child] of Object.entries(node.properties ?? {})) {
				await walk(child, object[key], {
					...at,
					path: [...at.path, key],
					required: !!node.required?.includes(key)
				})
			}
			return
		}
		case 'array': {
			if (!node.items) return
			// Blank rows of string lists are dropped when cleaned, so they're never missing
			const required = node.items.type !== 'string'
			const items = value as unknown[]
			for (const [index, item] of items.entries()) {
				await walk(node.items, item, {...at, path: [...at.path, index], required})
			}
			return
		}
		case 'ref':
			return walkRef(node.ref ?? '', value, at)
		case 'union': {
			const member = unionMember(node, (value as {$type?: unknown}).$type, at.base)
			if (member) await walkRef(member, value, at)
			return
		}
	}
}

async function walkRef(ref: string, value: unknown, at: Walk): Promise<void> {
	const target = await at.resolve(ref, at.base)
	// Unresolved refs are edited as raw JSON and left to the server's validation
	if (!target || target.node.type === 'token') return
	await walk(target.node, value, {...at, base: target.nsid})
}
