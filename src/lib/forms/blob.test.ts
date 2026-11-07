import {expect, test} from 'vitest'
import {acceptsType, blobInfo, fileProblem} from './blob'

test('accept lists take exact types and wildcards', () => {
	expect(acceptsType(['image/*'], 'image/webp')).toBe(true)
	expect(acceptsType(['image/png', 'image/jpeg'], 'image/gif')).toBe(false)
	expect(acceptsType(['*/*'], 'video/mp4')).toBe(true)
	expect(acceptsType(undefined, 'video/mp4')).toBe(true)
})

test('files are checked for type, then size', () => {
	const node = {type: 'blob', accept: ['image/*'], maxSize: 1000}
	expect(fileProblem(node, {type: 'text/plain', size: 1})).toEqual({code: 'type'})
	expect(fileProblem(node, {type: 'image/png', size: 2000})).toEqual({
		code: 'size',
		size: 2000,
		max: 1000
	})
	expect(fileProblem(node, {type: 'image/png', size: 10})).toBeUndefined()
})

test('blob info from typed and legacy refs', () => {
	expect(blobInfo({$type: 'blob', mimeType: 'image/png', size: 3})).toEqual({
		mimeType: 'image/png',
		size: 3
	})
	expect(blobInfo({cid: 'x', mimeType: 'image/png'})).toEqual({mimeType: 'image/png'})
	expect(blobInfo('nope')).toBeUndefined()
})
