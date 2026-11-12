/** Records saved as a JSON file: their at:// URIs, CIDs and values, as read */
import type {RepoRecord} from '#lib/atproto/repo'

export function saveRecords(records: RepoRecord[], name: string) {
	const json = JSON.stringify(
		records.map(({uri, cid, value}) => ({uri, cid, value})),
		null,
		2
	)
	const link = document.createElement('a')
	link.href = URL.createObjectURL(new Blob([json], {type: 'application/json'}))
	link.download = `${name}-${new Date().toISOString().slice(0, 10)}.json`
	link.click()
	URL.revokeObjectURL(link.href)
}
