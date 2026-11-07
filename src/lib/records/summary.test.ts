import {expect, test} from 'vitest'
import {recordDate, recordSummary} from './summary'

test('a title-like property first', () => {
	expect(recordSummary({createdAt: '2026-01-01T00:00:00Z', text: 'hello', title: 'Hi'})).toBe('Hi')
})

test('else the first string in lexicon order, skipping dates', () => {
	const record = {
		type: 'object',
		properties: {
			at: {type: 'string', format: 'datetime'},
			count: {type: 'integer'},
			label: {type: 'string'}
		}
	}
	expect(recordSummary({at: '2026-01-01T00:00:00Z', count: 2, label: 'ok'}, record)).toBe('ok')
})

test('strong refs summarize by their URI', () => {
	expect(recordSummary({subject: {uri: 'at://x/y.z.w/1', cid: 'b'}})).toBe('at://x/y.z.w/1')
})

test('dates only when valid', () => {
	expect(recordDate({createdAt: '2026-01-01T00:00:00Z'})).toBe('2026-01-01T00:00:00Z')
	expect(recordDate({createdAt: 'yesterday'})).toBeUndefined()
})

test('the record type is not a summary', () => {
	expect(recordSummary({$type: 'xyz.statusphere.status', status: '🙂'})).toBe('🙂')
})
