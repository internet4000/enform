# Plan

Larger changes, most useful first. Each names the savoir-faire practice it follows.

## Shell and screens

1. **One app shell** (`app-shell`): search alone at the top (a handle, an app domain or
   an NSID: it already knows all three), tabs at the bottom on phones and a rail on the
   left from 64rem, a More tab for Settings and the rest, the account control in one
   place (Me). The reader bar stays outside the page, as it is now.
2. **Sheets and the reader as native `<dialog>`** (`native-dialogs`): the record sheet is
   a `role="complementary"` panel today. As a dialog it gets focus trapping, Escape and
   the backdrop for free; its URL stays (`?record=`), so back still closes it.
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

9. **Deploys from CI** (`hosting`): a workflow that runs `bun run verify` and the
   end-to-end suite, then deploys on `main`. Needs a Cloudflare API token as a
   repository secret (owner).
10. **Soft 404**: unknown paths fall back to the SPA, which shows "not found"; the
    worker should answer 404 for paths no route matches.

## Waiting on the owner

- Sign-out keeps the current account restored when another one remains (workaround
  around the OAuth library): keep it, or report upstream?
- `reauthorizing`: a 2s window ignoring the library's session-deleted event during a
  permission step-up (workaround, flagged in code).
- Handles in URLs as `/%40alice` when encoded by some clients: accept both forms?
- Plain descriptions for types in the directory, or only labels?
