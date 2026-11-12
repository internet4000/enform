/**
 * A permission asked for in a popup comes back to the app's page, in the popup: there,
 * not the app, but what just happened (given or not), while the library hands the
 * result to the page that asked and closes it. The popup can't be told by its opener
 * (the account's server may cut it off), so the page asking leaves a mark meanwhile.
 */
const MARK = 'enform:popup'
/** A popup's sign-in can't take longer than this */
const LONGEST = 15 * 60_000

export function markPopup(): () => void {
	try {
		localStorage.setItem(MARK, String(Date.now()))
	} catch {
		// Without storage: the popup shows the app, as before
	}
	return () => {
		try {
			localStorage.removeItem(MARK)
		} catch {
			// Nothing to forget
		}
	}
}

/** Whether this page is an OAuth answer coming back in a popup a page is waiting on */
export function isPopupCallback(): boolean {
	if (typeof location === 'undefined') return false
	const params = new URLSearchParams(location.search)
	if (!params.has('state') || !(params.has('code') || params.has('error'))) return false
	try {
		const since = Date.now() - Number(localStorage.getItem(MARK))
		return since >= 0 && since < LONGEST
	} catch {
		return false
	}
}

/** Whether the answer refuses (the person said no, or the server failed) */
export const refused = () => new URLSearchParams(location.search).has('error')
