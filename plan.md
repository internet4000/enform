# Plan

Larger changes, most useful first. Each names the savoir-faire practice it follows.

## Shell and screens

1. **Pins in your repo**: an opt-in "keep my pins in my repo", as records of a
   `com.internet4000.enform` lexicon (published at enform.internet4000.com), asking
   for write permission to that one collection when first used. Pins follow you to
   any device and instance; on this device only stays the default.
2. **Unsaved forms**: a sheet with a form being filled asks before closing (Escape, the
   backdrop, back), so nothing typed is lost.
3. **Filters from lexicons** (proposed, waiting for a yes): in the list's toolbar,
   filters each type's lexicon offers: chips for an enum, known values or a boolean
   (with counts), newest or oldest and a range for dates (any record's key is one),
   sort and range for numbers, "has a link" and by site, "with an image", one search
   across its text fields. Only those that split the list, kept in the URL. On the
   records loaded so far, saying so ("50, more to load").
4. **Screens before their data** (`designed-states`): app screens and the data view
   wait for the repo before showing a heading. Render the frame (header, tabs, empty
   grid) at once, then fill it; designed loading, empty and error states for each.

## Data and ecosystem

- **Your own types** (to design together first): make a type (a lexicon) on this
  device, then create, browse and play its records like any app's; publish it later.
  Needs a lexicon editor, local lexicons resolved like published ones, and publishing.

5. **View switcher**: show which view was inferred for a type (kind, presenter) and let
   people pick another, remembered per type. Nothing decided for good.
6. **App descriptions as data**: what `apps.json` says about an app (labels, related
   types, views) read from the app's own repo once a shared lexicon for it exists;
   until then, the directory stays the fallback.
7. **A lasting local copy** of collections people open often, for reading offline
   (`local-first`), next to the outbox.

## Delivery

8. **enform.internet4000.com on GitHub Pages**: set it as the repository's Pages
   custom domain and point its DNS (`CNAME` to `internet4000.github.io`); the workflow
   then builds for it on its own. Then remove `wrangler.jsonc` and `bun run deploy`.
9. **End-to-end suite in CI**: the local atproto network on Node, Playwright's
   Chromium, before publishing.

## Waiting on the owner

- Sign-out keeps the current account restored when another one remains (workaround
  around the OAuth library): keep it, or report upstream?
- `reauthorizing`: a 2s window ignoring the library's session-deleted event during a
  permission step-up (workaround, flagged in code).
- Handles in URLs as `/%40alice` when encoded by some clients: accept both forms?
- Plain descriptions for types in the directory, or only labels?
