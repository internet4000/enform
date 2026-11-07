/** The lexicon schemas the local network publishes, one JSON file each per authority */
import fs from 'node:fs/promises'
import path from 'node:path'
import {fileURLToPath} from 'node:url'

const dir = fileURLToPath(new URL('../lexicons', import.meta.url))

/** @param {string} authority e.g. "enform.test" */
export async function schemas(authority) {
	const files = (await fs.readdir(path.join(dir, authority))).filter((f) => f.endsWith('.json'))
	return Promise.all(
		files.map(async (file) =>
			JSON.parse(await fs.readFile(path.join(dir, authority, file), 'utf8'))
		)
	)
}
