# Local profiles and local-first writes

## Why

- **Try apps without an account**: start a radio, a list, a status on this device,
  publish it to an account later (onboarding).
- **Work offline, read instantly**: writes don't wait on the network.
- **Test every create, edit and delete headless**, with no credentials.

## Atproto first

An atproto repo has one writer (an account, from any of its devices). Records are
addressed by collection and record key, and versioned by CID; enform already writes
with `swapRecord`, so a record changed elsewhere is never overwritten silently. That
is enough: no CRDT is needed, those matter when several people edit one document.

Nothing local pretends to be atproto:

- A local profile has **no DID and no handle**. It is named by its person, marked
  "on this device", and its records never leave the browser until published.
- Its records are **valid records of their lexicons**: same forms, same validation,
  record keys as atproto makes them (TIDs, or the lexicon's literal key), so
  publishing keeps them.

## Local profiles

- Stored in the browser's IndexedDB: profiles, and records keyed by
  `[profile, collection, rkey]` with their value and a version (a hash of the value).
- Opened like any repo, at `/@local:<id>`: the same panes, apps, lists and forms.
  Reads and writes go through the same modules as remote repos
  (`src/lib/atproto/repo.ts`, `write.ts`), which dispatch on the repo.
- **Who you are** is the current account _or_ local profile: Settings lists both,
  to switch to, add or remove. Owner actions (Add, Edit, Delete) follow it.
- **Publishing** copies a local profile's records into a signed-in account in one
  batch (`com.atproto.repo.applyWrites`), after one permission request covering all
  their collections, keeping record keys. The local profile can then be removed.
- Not in the first version: blobs (files) in local profiles.

## Writes to accounts, local-first (second step)

- A write to an account first lands in an **outbox** in IndexedDB, and shows at once
  (lists and records read the outbox over the PDS).
- The outbox is sent in order when online and authorized; each write keeps its
  `swapRecord`. A conflict (the record changed elsewhere) stops that write and shows
  both versions to choose from; nothing is overwritten silently.
- A **local copy** of read collections makes repeat visits instant; the PDS stays
  the source of truth and refreshes it.

## Testing

- Unit tests run the local store on an in-memory IndexedDB.
- End-to-end tests drive local profiles in a headless browser (create, edit, delete,
  apps, copy), and sign-in and permissions against a local atproto network.
