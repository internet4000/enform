/**
 * Unauthenticated XRPC queries with plain fetch. Repos are public, so reading any of
 * them needs no session. Only CORS-safelisted headers, so PDSes answer without a preflight.
 */
import app from '#lib/config/app.json' with {type: 'json'}

export type XrpcParams = Record<string, string | number | boolean | undefined>

export class XrpcError extends Error {
	constructor(
		readonly status: number,
		readonly error: string | undefined,
		message: string
	) {
		super(message)
	}
}

export async function xrpcGet<T>(
	service: string,
	nsid: string,
	params: XrpcParams = {}
): Promise<T> {
	const url = new URL(`/xrpc/${nsid}`, service)
	for (const [key, value] of Object.entries(params)) {
		if (value !== undefined) url.searchParams.set(key, String(value))
	}
	const res = await fetch(url, {signal: AbortSignal.timeout(app.reads.timeoutMs)})
	const body = await res.json().catch(() => undefined)
	if (!res.ok) {
		throw new XrpcError(res.status, body?.error, body?.message ?? `${nsid} failed (${res.status})`)
	}
	return body as T
}
