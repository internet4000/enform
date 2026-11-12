# Plan

Larger changes, most useful first. Each names the savoir-faire practice it follows.

## Describing the atmosphere (docs/architecture.md › Where it is going)

1. **The description engine**: `describeType`, `describeApp`, `describeRecord` in one
   pure module, consolidating today's inferences, each with why it was made; a corpus
   of real lexicons and records (Bluesky, Radio4000, Tangled, WhiteWind, Statusphere,
   events…) and their expected descriptions, in the unit tests. Then the views read
   descriptions, and say why (and let people change it).
   Started: `describeType` (src/lib/describe), with why; `kindOf` reads it; the corpus
   (22 published lexicons, 5 types known by their records) in
   `corpus/descriptions.json`. It follows refs to a lexicon's other definitions, reads
   records keyed by the account they point at, tells blocks from follows and articles
   from lists, and names records by their key when that is what names them (a repo's
   slug, a lexicon's NSID). Example apps (docs/examples.md) and the CLI (docs/cli.md)
   test it, from types alone. `describeRecord` started (src/lib/describe/record.ts):
   a record's title, read by every view that names one. Then the rest of
   `describeRecord` (card, text, image, actions, `records/card` and `summary` folded
   in) and `describeApp` (consolidating apps/apps, accounts, related, person, quick).
2. **Views apart from their shell**: views (person, app home, type list, record,
   lexicon, search) out of the routes, given the session, links and reader through
   context; routes become thin. Done first: addresses, after `#` in the app (hash
   routing, `src/lib/paths.ts`), the same in the embed's links.
3. **Views as web components**: each view a custom element, and `<enform-app>`, a hash
   router around them with the app's addresses, replacing `<enform-embed>` in the npm
   package.

## Shell and screens

4. **Pins in your repo**: an opt-in "keep my pins in my repo", as records of a
   `com.internet4000.enform` lexicon (published at enform.internet4000.com), asking
   for write permission to that one collection when first used. Pins follow you to
   any device and instance; on this device only stays the default.
5. **Unsaved forms**: a sheet with a form being filled asks before closing (Escape, the
   backdrop, back), so nothing typed is lost.
6. **Filters, further**: the search field and lexicon filters work on the records loaded
   so far (chips for values, sites, images, #tags; orders). Still to do: ranges for dates
   and numbers, and filtering across every page (loading on until enough match).
7. **Screens before their data** (`designed-states`): app screens and the data view
   wait for the repo before showing a heading. Render the frame (header, tabs, empty
   grid) at once, then fill it; designed loading, empty and error states for each.

## Data and ecosystem

- **Your own types** (to design together first): make a type (a lexicon) on this
  device, then create, browse and play its records like any app's; publish the type
  (its lexicon, not the device's records) under your domain. Needs a lexicon editor,
  and local lexicons resolved like published ones.

8. **View switcher, further**: a record shows rendered, as fields or as JSON,
   remembered per type. Still to do: the same for a list (cards, rows, a table) and
   picking another kind or presenter than the one inferred.
9. **App descriptions as data**: what `apps.json` says about an app (labels, related
   types, views) read from the app's own repo once a shared lexicon for it exists;
   until then, the directory stays the fallback.
10. **A lasting local copy** of collections people open often, for reading offline
    (`local-first`), next to the outbox.

## Found by the example apps

- **Pictures on this device**: local profiles hold no files yet, so an example app's
  picture (radio.example's) can't be added on a device.

## Waiting on the owner

- Sign-out keeps the current account restored when another one remains (workaround
  around the OAuth library): keep it, or report upstream?
- `reauthorizing`: a 2s window ignoring the library's session-deleted event during a
  permission step-up (workaround, flagged in code).
- Handles in URLs as `/%40alice` when encoded by some clients: accept both forms?
- Plain descriptions for types in the directory, or only labels?
