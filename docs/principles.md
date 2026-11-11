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

## Writing

- OAuth only, no app passwords. Sign-in asks for `atproto` alone.
- Authorization servers accept only scopes the client metadata declares, as exact
  strings. So each write steps up, in a popup so forms keep their state, to:
  - `repo:<nsid>?action=<action>` for the collections listed in
    `src/lib/config/permissions.json`, one collection and action at a time;
  - `repo:*?action=<action>` for any other collection. The app says plainly that
    this covers every collection;
  - `identity:handle` to change your handle (`com.atproto.identity.updateHandle`):
    a name under one of your server's domains (`describeServer`), or your own
    domain once it resolves to you, by DNS TXT or `/.well-known/atproto-did`.
- Each step-up requests everything already granted plus what's new, since a new
  authorization replaces the session's scope.
- Records are written only to the signed-in user's repo, never with
  `validate: false`, and with `swapRecord` against lost updates.
- Records whose lexicon can't be resolved are read-only.

## The interface follows the data

- What a record type is (a profile, a post, a photo, a link, a follow, a reaction,
  a status, an event, a list) is read from its lexicon's shape
  (`src/lib/records/kinds.ts`), for every app. From it come the actions offered in
  plain words, and how records show as cards and in detail; the lexicon's own
  description explains each type.
- Always clear, never repeated: whose data is their handle, once, where the page is
  named; who you act as is in the shell (the rail's account, the tab bar on phones);
  where it's kept, the handle says (`.local` is this device). No "this is you"
  labels: what is yours shows by what you can do with it (edit, add).

## Forms

- Every form is generated from its lexicon, and improved through patterns keyed on
  lexicon definitions (a field's type, format, constraints and siblings), never on
  a particular app. Per-app knowledge only lives in the editable directory
  (`src/lib/config/apps.json`), e.g. names and declared related types.
- Example: a `format: uri` field previews its link, and fills empty plain-text
  title and description siblings, within their limits, never over what someone typed.
- Link details come from media-now (media providers' own oEmbed endpoints) and a
  link card service (`services.linkCards`, Bluesky's by default): pasting a link
  sends it to them.

## Namespace

enform's own lexicons are `com.internet4000.enform.*`, published by the account
`enform.internet4000.com` and resolved through `_lexicon.enform.internet4000.com`.
