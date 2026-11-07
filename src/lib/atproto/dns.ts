/**
 * DNS TXT lookups, as atproto handle and lexicon resolution define them. Browsers
 * can't query DNS directly, so this reads it over DNS-over-HTTPS (config/app.json).
 */
import app from '#lib/config/app.json' with {type: 'json'}

type DnsJson = {Answer?: {type: number; data: string}[]}

const TXT = 16

/** The values of TXT records at `name` that start with `did=`, as DIDs */
export async function txtDids(name: string): Promise<string[]> {
	const url = new URL(app.services.dnsOverHttps)
	url.searchParams.set('name', name)
	url.searchParams.set('type', 'TXT')
	const res = await fetch(url, {
		headers: {accept: 'application/dns-json'},
		signal: AbortSignal.timeout(app.reads.timeoutMs)
	})
	if (!res.ok) return []
	const json = (await res.json()) as DnsJson
	return (json.Answer ?? [])
		.filter((answer) => answer.type === TXT)
		.map((answer) => answer.data.replace(/^"|"$/g, '').replace(/"\s*"/g, ''))
		.filter((value) => value.startsWith('did='))
		.map((value) => value.slice('did='.length))
}
