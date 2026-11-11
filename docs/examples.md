# Example apps

Apps made from their record types alone: enform comes with their lexicons
(`src/lib/lexicons/examples`), and generates everything else (their screens, cards,
forms, reader and profile home) through the description engine (docs/architecture.md ›
Where it is going). They show what enform makes of a type, and test it: each is
designed to exercise part of the engine.

| App              | Types                  | Exercises                                   |
| ---------------- | ---------------------- | ------------------------------------------- |
| note.example     | profile, entry         | a profile's home; plain text                |
| bookmark.example | link                   | a link, its preview; a list of tags         |
| radio.example    | profile, track, follow | a picture, a link to media, an account      |
| event.example    | event, rsvp            | a start date; a reference to another record |
| status.example   | status                 | one short value (an emoji)                  |
| recipe.example   | recipe                 | a title, lists of text                      |
| blog.example     | post                   | an article: a title and a long text         |

## Why `example`

`example` is a reserved domain (RFC 2606): no one can own `note.example`, so no one can
publish lexicons for `example.note.*`. That makes the NSIDs safe to use, and sets their
limits: they can't be resolved from the network, so they are bundled; and their records
stay on this device (a local profile), never written to a repo, where nothing could
read them (`src/lib/atproto/write.ts`; publishing a local profile keeps them there).

Your own types are the next step: the same, under a domain you control, published as
atproto specifies, so their records can live in your repo (plan.md).

## Testing with them

- The corpus (`src/lib/describe/corpus.test.ts`) describes each type, snapshotted in
  `corpus/descriptions.json`, and requires no gaps (docs/cli.md › check).
- `e2e/examples.spec.ts` goes through every type of every example app on this device:
  its form filled from its fields' types (no code per type), the record shown rendered
  (never empty), edited, deleted. A type enform handles badly fails there.

To add an example app: its lexicons in `src/lib/lexicons/examples`, listed in its
`index.ts`; both tests take it in.
