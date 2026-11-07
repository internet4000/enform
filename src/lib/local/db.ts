/**
 * The browser's own database (IndexedDB) for local profiles and their records.
 * Records are keyed [profile, collection, rkey], listed by [profile, collection].
 */
const NAME = 'enform'
const VERSION = 1

export const PROFILES = 'profiles'
export const RECORDS = 'records'
export const BY_COLLECTION = 'byCollection'

let opened: Promise<IDBDatabase> | undefined

export function db(): Promise<IDBDatabase> {
	opened ??= new Promise((resolve, reject) => {
		const request = indexedDB.open(NAME, VERSION)
		request.onupgradeneeded = () => {
			const database = request.result
			database.createObjectStore(PROFILES, {keyPath: 'id'})
			const records = database.createObjectStore(RECORDS, {
				keyPath: ['profile', 'collection', 'rkey']
			})
			records.createIndex(BY_COLLECTION, ['profile', 'collection'])
		}
		request.onsuccess = () => resolve(request.result)
		request.onerror = () => reject(request.error)
	})
	return opened
}

/** Runs one request in a transaction, resolving with its result */
export async function run<T>(
	store: string,
	mode: IDBTransactionMode,
	request: (store: IDBObjectStore) => IDBRequest<T>
): Promise<T> {
	const transaction = (await db()).transaction(store, mode)
	const pending = request(transaction.objectStore(store))
	return new Promise((resolve, reject) => {
		transaction.oncomplete = () => resolve(pending.result)
		transaction.onerror = () => reject(transaction.error)
		transaction.onabort = () => reject(transaction.error)
	})
}
