/**
 * A DNS-over-HTTPS (JSON) answerer for the local network, in the format the app reads
 * (Cloudflare's dns-json): TXT records only.
 * - `_atproto.<handle>`: the handle's DID, as its PDS resolves it
 * - `_lexicon.<authority>`: the DID publishing that authority's lexicons
 */
import http from 'node:http'

const TXT = 16

/**
 * @param {{port: number, pds: string, lexicons: Record<string, string>}} options
 *   `lexicons` maps an authority (e.g. "enform.test") to its publisher's DID
 */
export function startDns({port, pds, lexicons}) {
	async function txt(name) {
		if (name.startsWith('_lexicon.')) {
			const did = lexicons[name.slice('_lexicon.'.length)]
			return did ? [did] : []
		}
		if (name.startsWith('_atproto.')) {
			const url = new URL('/xrpc/com.atproto.identity.resolveHandle', pds)
			url.searchParams.set('handle', name.slice('_atproto.'.length))
			const res = await fetch(url)
			return res.ok ? [(await res.json()).did] : []
		}
		return []
	}

	const server = http.createServer(async (req, res) => {
		const url = new URL(req.url ?? '/', `http://localhost:${port}`)
		res.setHeader('access-control-allow-origin', '*')
		res.setHeader('access-control-allow-headers', '*')
		if (req.method === 'OPTIONS') return res.writeHead(204).end()
		if (url.pathname === '/health') return res.writeHead(200).end('ok')
		const name = (url.searchParams.get('name') ?? '').replace(/\.$/, '').toLowerCase()
		const dids = await txt(name).catch(() => [])
		const body = {
			Status: dids.length ? 0 : 3,
			Question: [{name, type: TXT}],
			Answer: dids.map((did) => ({name, type: TXT, TTL: 60, data: `"did=${did}"`}))
		}
		res.writeHead(200, {'content-type': 'application/dns-json'}).end(JSON.stringify(body))
	})
	return new Promise((resolve) => server.listen(port, () => resolve(server)))
}
