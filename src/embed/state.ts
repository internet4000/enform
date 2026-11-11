/** `$app/state` in the embed: the page it is embedded in */
export const page = {
	get url() {
		return new URL(location.href)
	},
	shallow: {} as {url?: URL}
}
