# Architecture

enform shows and edits any atproto record, for any app, without code written for
that app. Each layer derives from the one below, and each can be extended or
overridden without touching the others. Nothing decides for people for good: what is
inferred is shown, and another view is always one tap away.

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
on phones, with what's up next) and full screen.

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
