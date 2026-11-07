import type {RepoRecord} from '#lib/atproto/repo'
import type {CollectionKind} from '#lib/lexicons/kind'
import type {LexiconDoc} from '#lib/lexicons/types'

/** A record type of an app, and whether the repo has any */
export type AppType = {
	nsid: string
	/** Its name within the app: radio.4000.track → track, app.bsky.feed.post → feed post */
	name: string
	kind: CollectionKind
	lexicon?: LexiconDoc
	/** The repo has records of it */
	used: boolean
}

/** A one-record type (literal key), with the repo's record when it has one */
export type AppSingle = AppType & {rkey: string; record?: RepoRecord}

/**
 * An app as a repo has it: its main profile, its lists (types with many records),
 * its other one-record types (settings), and the types it has none of yet.
 */
export type RepoApp = {
	/** The app's domain, e.g. 4000.radio */
	app: string
	/** Its NSID namespace, e.g. radio.4000 */
	namespace: string
	profile?: AppSingle
	lists: AppType[]
	singles: AppSingle[]
	/** Whether its lexicons are published (else only the repo's collections are known) */
	published: boolean
}
