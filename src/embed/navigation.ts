/** `$app/navigation` in the embed: no router, links are enform's pages */
export async function goto(url: string) {
	location.assign(url)
}

export async function refreshAll() {}
