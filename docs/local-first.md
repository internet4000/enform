# Local profiles and local-first writes

People see a local profile as an **account on this device**, always marked so ("This
device only"): one word for whoever you act as. In code and here it stays a local profile.

## Why

- **Try apps without an account**: start a radio, a list, a status on this device,
  privately (onboarding).
- **Private by design**: what is made on a device stays on it. A repo is public, so
  nothing moves from one to the other: no publishing a local profile, no account
  record pointing at a device's (`pointsOnDevice`, `src/lib/atproto/write.ts`), no
  pins carried over.
- **Work offline, read instantly**: writes don't wait on the network.
- **Test every create, edit and delete headless**, with no credentials.

## Atproto first

An atproto repo has one writer (an account, from any of its devices). Records are
addressed by collection and record key, and versioned by CID; enform already writes
with `swapRecord`, so a record changed elsewhere is never overwritten silently. That
is enough: no CRDT is needed, those matter when several people edit one document.

Nothing local pretends to be atproto:

- A local profile has **no DID**, and a handle only this device knows: its name,
  slugified, under `.local` (`@my-radio.local`), which no atproto handle can be. It
  is named by its person, marked "on this device", and its records never leave the
  browser.
- Its records are **valid records of their lexicons**: same forms, same validation,
  record keys as atproto makes them (TIDs, or the lexicon's literal key), and CIDs.

## Local profiles

- Stored in the browser's IndexedDB: profiles, and records keyed by
  `[profile, collection, rkey]` with their value and a version (a hash of the value).
- Opened like any repo, at `/@<name>.local` (links to `/@local:<id>` still open): the same panes, apps, lists and forms.
  Reads and writes go through the same modules as remote repos
  (`src/lib/atproto/repo.ts`, `write.ts`), which dispatch on the repo.
- **Who you are** is the current account _or_ local profile: Settings shows it at its
  top; Settings › Switch account lists both in one list, to switch to, add or remove. Owner actions (Add, Edit, Delete) follow it.
- **Never published**: an account starts from nothing of the device's. Making the
  same thing there is done again, on purpose, as that account.
- Not in the first version: blobs (files) in local profiles.

## Writes to accounts, local-first

- A write whose PDS can't be reached (offline, unreachable), and whose permission is
  already granted, lands in an **outbox** in IndexedDB and shows at once, marked
  "not sent yet"; the header says how many wait. A write needing a new permission
  is never queued: asking needs your tap, so it's written (or fails) right away.
- Reads of your own repo lay the waiting writes over what the PDS returns, and show
  what was last read (this visit) while it can't be reached.
- The outbox is sent in order on start and when the network is back; a write that
  waited on another swaps against the version that one made, kept with it should
  sending stop in between. A conflict (the record changed elsewhere) or a refusal
  stops that write, and the later writes of its record wait behind it, kept in
  Settings › Waiting to be sent, to give up; the next then swaps against the version
  the one given up would have written over. Nothing is overwritten silently.
- The app itself works offline: a service worker keeps its built files.
- Not yet: a lasting local copy of read collections (only this visit's reads).

## Testing

- Unit tests run the local store on an in-memory IndexedDB.
- End-to-end tests drive local profiles in a headless browser (create, edit, delete,
  apps, copy), and sign-in and permissions against a local atproto network.
