/**
 * A local atproto network for end-to-end tests (Node 22+, not Bun: the PDS uses
 * better-sqlite3). @atproto/dev-env runs a PLC directory (in memory) and a PDS (SQLite
 * in a temp directory, OAuth with its sign-in pages over http://localhost), plus a
 * DNS-over-HTTPS answerer for `_atproto` and `_lexicon` TXT lookups. It then creates
 * the accounts in e2e/network.json and publishes the lexicons in e2e/lexicons/, writes
 * the endpoints and the app's e2e config to e2e/.network/, and runs until stopped.
 *
 * LOG_ENABLED=true shows the PDS's logs.
 */
import config from './network.json' with {type: 'json'}
import {startDns} from './network/dns.mjs'
import {schemas} from './network/lexicons.mjs'
import {E2E_APP_CONFIG, ENDPOINTS, writeAppConfig, writeEndpoints} from './network/app-config.mjs'

process.env.LOG_ENABLED ??= 'false'
// After LOG_ENABLED, which the PDS's logger reads when it loads
const {TestNetworkNoAppView} = await import('@atproto/dev-env')

const {ports} = config

const network = await TestNetworkNoAppView.create({
	plc: {port: ports.plc},
	pds: {port: ports.pds}
})
const agent = network.pds.getAgent()

/** @type {Record<string, string>} handle → DID */
const dids = {}
for (const account of config.accounts) {
	const {data} = await agent.createAccount(account)
	dids[account.handle] = data.did
}

/** @type {Record<string, string>} lexicon authority → its publisher's DID */
const authorities = {}
for (const {authority, publisher} of config.lexicons) {
	const account = config.accounts.find((a) => a.handle === publisher)
	await agent.login({identifier: account.handle, password: account.password})
	for (const schema of await schemas(authority)) {
		await agent.com.atproto.repo.createRecord({
			repo: agent.assertDid,
			collection: 'com.atproto.lexicon.schema',
			rkey: schema.id,
			record: {$type: 'com.atproto.lexicon.schema', ...schema}
		})
	}
	authorities[authority] = dids[publisher]
}

const endpoints = {
	plc: network.plc.url,
	pds: network.pds.url,
	dns: `http://localhost:${ports.dns}/dns-query`,
	dids,
	authorities
}
await writeAppConfig(endpoints)
await writeEndpoints(endpoints)
// Last, so that it answering means the network is ready
const dns = await startDns({port: ports.dns, pds: network.pds.url, lexicons: authorities})

console.log(JSON.stringify(endpoints, null, 2))
console.log(`Endpoints: ${ENDPOINTS}\nApp config: ${E2E_APP_CONFIG}`)

async function stop() {
	dns.close()
	await network.close()
	process.exit(0)
}
process.on('SIGINT', stop)
process.on('SIGTERM', stop)
