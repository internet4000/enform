# CLI

The description engine in a terminal: what enform makes of a record type (its kind, the
role of each field, how many an account has, what it points at), and why. The same code
as the app (`src/lib/describe`); it reads as atproto specifies and writes nothing.

    bun run enform describe app.bsky.feed.post              # an NSID, resolved
    bun run enform describe ./lexicons/                      # a folder of lexicon files
    bun run enform describe ./tracks.json                    # sample records: [{rkey, value}]
                                                             # or listRecords' answer
    bun run enform describe at://hwww.org/com.radio4000.track  # a repo's collection: its
                                                             # lexicon, else its records
    bun run enform check ./lexicons/                         # and what can't be inferred
    bun run enform check examples                            # every example app
    bun run enform examples                                  # the example apps and types

`--json` prints the descriptions, with every reason, for scripts.

## check

Describes each type and lists its gaps: nothing telling (no title, text, link,
picture…), or nothing to show it by. It exits 1 when there are any, so app developers
can run it on their lexicons in CI, to see how a generic client reads them before they
publish. The example apps have none (a test requires it).

## Example

    $ bun run enform describe at://hwww.org/com.radio4000.track
    com.radio4000.track  link  (records, from 25 records of at://hwww.org/com.radio4000.track)
      kind    link         has-link: url
      count   many         records-keyed-numbers
      url     url          format-uri: url
      title   title        usual-name: title
      text    description  usual-name: description
      date    created_at   usual-name-datetime: created_at

Still to come: `render`, the markup enform generates for a type (its cards, rendered
view and form, with their elements and attributes), once views render from
descriptions alone (plan.md › Describing the atmosphere, 2).
