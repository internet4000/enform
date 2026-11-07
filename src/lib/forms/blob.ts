/** Checking a file against a blob's lexicon constraints, before uploading it */
import type {LexNode} from '#lib/lexicons/types'

/** Whether a MIME type is in an accept list (`image/*` and `*\/*` included) */
export function acceptsType(accept: string[] | undefined, mimeType: string): boolean {
	if (!accept?.length) return true
	return accept.some((pattern) => {
		if (pattern === '*/*' || pattern === mimeType) return true
		return pattern.endsWith('/*') && mimeType.startsWith(pattern.slice(0, -1))
	})
}

export type FileProblem = {code: 'type'} | {code: 'size'; size: number; max: number}

export function fileProblem(
	node: LexNode,
	file: {type: string; size: number}
): FileProblem | undefined {
	if (!acceptsType(node.accept, file.type)) return {code: 'type'}
	if (node.maxSize !== undefined && file.size > node.maxSize) {
		return {code: 'size', size: file.size, max: node.maxSize}
	}
	return undefined
}

/** A blob ref's MIME type and size, from either of the data model's forms */
export function blobInfo(value: unknown): {mimeType: string; size?: number} | undefined {
	if (typeof value !== 'object' || value === null) return undefined
	const blob = value as {mimeType?: unknown; size?: unknown}
	if (typeof blob.mimeType !== 'string') return undefined
	return {mimeType: blob.mimeType, size: typeof blob.size === 'number' ? blob.size : undefined}
}
