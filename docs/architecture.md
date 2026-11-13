# Architecture

enform shows and edits any atproto record, for any app, without code written for
that app. Each layer derives from the one below, and each can be extended or
overridden without touching the others. Nothing decides for people for good: what is
inferred is shown, and another view is always one tap away.

## Where it is going

The objective (AGENTS.md): describe the atmosphere, and generate from that description
a super app of all apps. So the code is organised around a description engine, and
everything else renders its output. Today the inferences are spread over modules that
components call directly (`records/kinds`, `card`, `summary`, `actions`,
`capabilities/detect`, `apps/apps`, `related`, `person`, `quick`); they converge into:

1. **Description** (pure TypeScript, no UI): `describeType` (from a lexicon, else
   sample records: its kind, each field's role, how many an account has, its verbs
   and actions), `describeApp` (its profile type, lists, single records, how its types
   relate, what it is about) and `describeRecord` (title, text, image, date, actions,
   what it points at). Every inference says why it was made, so the interface can
   explain it and people can change it. Overrides are layered data, never code:
   inferred, then the directory, then what an app publishes about itself, then the
   person's own choice. A corpus of real lexicons and records with their expected
   descriptions measures each change on every app at once.
2. **Data**: reading (identity, collections, records, lexicons), deduplicated and
   cached locally; the graph followed outward from what records point at. Who points
   at a record needs a backlink index: optional, and said so.
3. **Addresses**: one module parses and builds every address (a person, an app, a
   type, a record, `at://`); every link goes through it, with a base given to it (a
   hash, another instance). Done for links: `src/lib/paths.ts` builds them after `#`
   (the host never sees them), and reads where one is (`addressOf`, `shownUrl`); the
   embed links to an instance's same addresses. A repo has two views at one address:
   as its apps show it (`/@alice/apps/bsky.app?type=…&record=…`) and as it is stored,
   in panes, the same address under `/data`; the App | Data switch keeps one's place.
4. **Views**: person, app home, type list, record, lexicon, search. Each takes an
   address and renders descriptions only; what it needs from around it (the session,
   links, the reader) comes through Svelte context. Each is also a custom element.
5. **Shells**: the SvelteKit app (sign-in, writing, settings, pins), its routes thin
   (URL, address, view); and `<enform-app>` on npm, a hash router around the same
   views, read-only unless the page serves its own OAuth client metadata.

## Layers

1. **Data**: records, read from their repo's own PDS, and their lexicons, resolved
   as atproto specifies (`src/lib/atproto`, `src/lib/lexicons`).
2. **Capabilities**: what a record can do, found in its data and lexicon by small
   detectors (`src/lib/capabilities`): media to play (a URL media-now knows, an
   audio or video file), images to show, a place, a date, text to read, a link.
   They don't depend on apps or types: a Bluesky post with a video plays like a
   Radio4000 track.
3. **Kinds**: what a record type is, from its lexicon's shape
   (`src/lib/records/kinds.ts`): profile, post, photo, link, follow… They choose the
   default card and detail, and the plain verbs offered.
4. **Presenters**: a component per capability (`src/lib/components/present`), picked
   from a registry: a record is shown by the presenter of its main capability.
5. **Descriptions**: how an app wants its types shown, as declarative data
   (`src/lib/config/apps.json` today: names, labels, related types). They override
   inferences; they are never code.

## The reader

Any list of records can be read one after another, in a reader: prev and next for
everything, and each presenter says when its record is done (a track ended, a photo
shown for a while, text when you move on). Autoplay goes on to the next record when
one is done. Like Radio4000's decks, it is always at hand in one of three modes: small
(a bar, its media playing out of sight), docked (beside the page from 64rem, below it
on phones, with what's up next) and full screen. Docked or full, its controls and
media stay in place while the record's text and the list scroll; each record of the
list has its menu (open, edit yours, share, copy its at:// link, take it out).

Every record a list shows has its own actions, found like everything else
(`src/lib/records/actions.ts`): play its media, view its images, see its place, read
its text (in the reader, from it on with its list), or go to what its lexicon says it
points at (an account by a `did` field, a record by an `at-uri` or a strongRef). A
card shows the first; a record, all of them. Several lists can be at hand at once, a
deck each (a radio's tracks, someone's posts): one is in front, and every deck stays
mounted, so what another plays goes on, to its next record; starting a list again
comes back to its deck. This is libli's idea of
actions per event type and a player per type, with no registry: the record's data and
its lexicon say what it can do.

## A profile's home in an app

What a profile has in an app is written nowhere: a radio's tracks don't point at the
radio. They are in the same repo, in the same app's namespace, and that is the link.
So an app's screen opens on its overview, under the profile's header (its one-record
type, a `literal:` key): a shelf for each of the app's other types the repo has: how
many, its first records, read or play them all, add one when it's yours. Each type
is also a tab: the profile's shows its record alone, a list's all its records. Bluesky's posts, a radio's
tracks, someone's Tangled repos: the same, from the repo alone.

## All a record holds

A kind shows what carries a type's meaning (its title, text, link, picture, date);
whatever no role shows is shown too, by its shape (`recordRest` in
`src/lib/describe/record.ts`): a list of short items as a list (a recipe's
ingredients), of long ones numbered (its steps), a text, a link, a date, and numbers,
yes or no and short values side by side. A card counts its lists (3 ingredients · 2
steps). Its title heads it, whatever its kind, and its own dates (created, updated)
close it. Nothing a record holds is only in its JSON.

## What a reference points at

A lexicon can't say which type a strongRef or an at:// URI points at: an RSVP's
`subject` is any record to it ("The event" only in its description). So it is
inferred (`src/lib/describe/references.ts`), with its reason: from the records (the
collections their references name), else from the field's name or description naming
a type of its app, else from the app (the one other type in it to point at). From
that, a record offers its answers (an event: "Answer: RSVP", its form open with the
reference set), and the field says what it points at and lists yours of it to pick.
Only a guess: the field still takes any record.

## An app's own accounts

An app's page shows the app as it shows itself: its own accounts, with what they have
in it and their first records (`src/lib/apps/accounts.ts`). No list of them is kept;
the protocol names them: the account its domain is the handle of (@bsky.app,
@joblist.today), and the account publishing its lexicons (`_lexicon` TXT records),
often the same one. An account with nothing in the app isn't shown.

## Pins

The apps someone keeps at hand, by domain, and the profiles in them (someone's radio),
by their DID and the app's domain, so a new handle keeps them: in their order, in the
rail from 64rem and first on Home. Each account and local profile has its own pins, as
who you act as decides them. With no one acting, pinning starts on this device, as its
default local profile (as starting an app does): pins are always someone's, and never
move from one account or profile to another. Kept on this device
(`localStorage`, by DID), so pinning asks for no permission.
Until something is pinned, the rail suggests the apps you have records in; it never
decides for you. Keeping pins in your own repo, as records of an enform lexicon, would
make them follow you to any device and any instance: planned, not done.

## Extending

- A capability: a detector function, registered with its presenter.
- A presenter: a component taking `{record, repo, lexicon}` and reporting `ended`.
- An app's description: data in the directory (and, if a shared lexicon for it
  emerges, read from the app's own repo, like its lexicons).
- A form pattern: keyed on lexicon shapes (docs/principles.md › Forms).

## Security

- **No code from apps or records**: descriptions are data, validated; records are
  rendered as text, never as HTML.
- **Content Security Policy**: scripts only from enform and the media providers'
  player APIs; frames only from those providers; connections over HTTPS anywhere
  (repos live anywhere). Listed in config, so each addition is deliberate.
- **Writes only to your own repo**, with the narrowest permission asked for at the
  moment it's needed (docs/principles.md › Writing).
- Links out open with `noopener noreferrer`; pasted links are sent only to the
  configured link-card and media services.
