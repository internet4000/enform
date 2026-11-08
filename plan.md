# Plan

Larger changes, most useful first. Each names the savoir-faire practice it follows.

## Shell and screens

1. **Pins in your repo**: an opt-in "keep my pins in my repo", as records of a
   `com.internet4000.enform` lexicon (published at enform.internet4000.com), asking
   for write permission to that one collection when first used. Pins follow you to
   any device and instance; on this device only stays the default.
2. **Unsaved forms**: a sheet with a form being filled asks before closing (Escape, the
   backdrop, back), so nothing typed is lost.
3. **Full width** (`radical-mobile-first`): pages are capped at `--measure` (60rem) and
   `--measure-wide` (72rem). Let grids use the screen; keep a measure only for text and
   forms.
4. **Screens before their data** (`designed-states`): app screens and the data view
   wait for the repo before showing a heading. Render the frame (header, tabs, empty
   grid) at once, then fill it; designed loading, empty and error states for each.
5. **Search-first lists**: filter any list of records by its text fields, in the URL
   (`?q=`), so a long collection is usable on a phone.

## Data and ecosystem

6. **View switcher**: show which view was inferred for a type (kind, presenter) and let
   people pick another, remembered per type. Nothing decided for good.
7. **App descriptions as data**: what `apps.json` says about an app (labels, related
   types, views) read from the app's own repo once a shared lexicon for it exists;
   until then, the directory stays the fallback.
8. **A lasting local copy** of collections people open often, for reading offline
   (`local-first`), next to the outbox.

## Delivery

9. **enform.internet4000.com on GitHub Pages**: set it as the repository's Pages
   custom domain and point its DNS (`CNAME` to `internet4000.github.io`); the workflow
   then builds for it on its own. Then remove `wrangler.jsonc` and `bun run deploy`.
10. **End-to-end suite in CI**: the local atproto network on Node, Playwright's
    Chromium, before publishing.

## Waiting on the owner

- Sign-out keeps the current account restored when another one remains (workaround
  around the OAuth library): keep it, or report upstream?
- `reauthorizing`: a 2s window ignoring the library's session-deleted event during a
  permission step-up (workaround, flagged in code).
- Handles in URLs as `/%40alice` when encoded by some clients: accept both forms?
- Plain descriptions for types in the directory, or only labels?
