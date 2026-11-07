# Principles

enform is a universal app for AT Protocol data: read your own repo and anyone's,
create, edit and delete records with forms generated from their lexicons, and follow
people or their collections. It stays strictly within the atproto specifications.
We don't hack the protocol.

## Identity

- Handle → DID through DNS (`_atproto` TXT) or HTTPS (`/.well-known/atproto-did`).
  A `com.atproto.identity.resolveHandle` service is only a fallback for browsers.
- A handle is shown only when the DID document claims it back (bidirectional check).
- The repo's host is the `#atproto_pds` service in its DID document. Never assume one.

## Reading

- Repos are public: reads are unauthenticated XRPC calls to the repo's own PDS.
- No backend of ours. Indexers or relays are optional accelerators, never the source of truth.

## Lexicons

- Resolution as specified: `_lexicon.<authority>` TXT → DID → `com.atproto.lexicon.schema`
  record whose key is the NSID.
- A lexicon describes data, not UI. UX hints live in our own records
  (`com.internet4000.enform.*`), never as extra fields in lexicon JSON.
- An NSID belongs to whoever controls its domain. enform never publishes or squats
  lexicons in namespaces it doesn't own.

## Writing (to come)

- OAuth only, no app passwords. Sign in asks for `atproto` alone. Each collection's
  `repo:<nsid>?action=…` scope is requested the first time it's needed, or the namespace's
  `include:` permission set when published.
- Records are written only to the signed-in user's repo, validated against their
  lexicon, never with `validate: false`, and with `swapRecord` against lost updates.
- Records whose lexicon can't be resolved are read-only.

## Namespace

enform's own lexicons are `com.internet4000.enform.*`, published by the account
`enform.internet4000.com` and resolved through `_lexicon.enform.internet4000.com`.
