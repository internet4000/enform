// What is open is read from the address by the page, as the app view's screen does: a
// click loads nothing again. Loading again (after a write) is what this load marks.
export function load() {
	return {read: Date.now()}
}
