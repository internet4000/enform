# enform

Your AT Protocol data, as an app. Open any account to see the apps it uses and its
records, shown through the lexicons their collections publish; create, edit and delete
your own with forms generated from those lexicons, signed in or in a local profile.

A static SvelteKit app with no backend: every repo is read from its own PDS.
See [docs/principles.md](docs/principles.md) for how enform keeps to the atproto specs,
and [docs/self-host.md](docs/self-host.md) to serve your own instance, anywhere.

## Develop

```sh
bun install
bun run dev      # http://127.0.0.1:5173
bun run test
bun run types
bun run build    # static site in dist/
bun run verify   # all of the above and formatting: before every commit
```

## End-to-end tests

Against a local atproto network, so signing in (OAuth), permission popups and
writes run headless without real accounts, and offline.

```sh
bun run test:e2e     # starts the network and the app, runs e2e/*.spec.ts
bun run e2e:network  # or only the network, to try by hand (Node 22+)
```

- `e2e/network.mjs` runs `@atproto/dev-env`: a PLC directory (in memory) and a PDS
  (SQLite in a temp directory) with its OAuth sign-in pages on `http://localhost`,
  plus a DNS-over-HTTPS answerer for `_atproto` and `_lexicon` lookups. No Postgres,
  Redis or Docker. It runs on Node, not Bun (the PDS uses better-sqlite3).
- `e2e/network.json`: ports, accounts (handles and passwords) and which account
  publishes each lexicon authority's schemas, from `e2e/lexicons/<authority>/`.
- The network writes `e2e/.network/app.json`: the app config with its services
  pointed at the network and `oauth.allowHttp` on. `vite --mode e2e` uses it in place
  of `src/lib/config/app.json`; other modes and builds are unchanged.
- Playwright (Chromium, phone and desktop sizes) blocks every request off localhost.

## Layout

- `src/lib/atproto/`: identity (DNS, DID documents) and public repo reads
- `src/lib/lexicons/`: lexicon resolution and refs
- `src/lib/records/`: how record values are summarized and shown
- `src/lib/forms/`: record forms from lexicons: initial values, constraints, cleaning, validation
- `src/lib/components/`: `enform-*` elements (`form/`: the generated record form)
- `src/lib/config/app.json`: services and settings
- `i18n/messages/`: translations
