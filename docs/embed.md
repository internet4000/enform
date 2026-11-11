# Embed

`<enform-embed>` shows a profile's home in an app on any web page: the app, whose
profile it is (picture, name, handle, words), a shelf per type their repo has there
(its first records, read or play them all), and the reader. It is enform's own view,
read-only: each record links to its page in enform, where its owner can edit it.

    <script type="module" src="https://cdn.jsdelivr.net/npm/@internet4000/enform@0/enform-embed.js"></script>
    <enform-embed actor="hwww.org" app="4000.radio"></enform-embed>

- `actor`: whose profile, a handle or a DID.
- `app`: the app, by its domain (`4000.radio`, `tangled.org`, `bsky.app`).
- `enform` (optional): the enform instance its links go to. By default, the one it was
  built with (`https://enform.internet4000.com/`, or your `ORIGIN` and `BASE_PATH`,
  docs/self-host.md).

## Where to load it from

- **npm**, `@internet4000/enform` (`packages/enform`): from a CDN as above, which serves
  any npm package (pin a version, `@0.1.0`, so the page changes only when you choose),
  or installed and imported (`import '@internet4000/enform'`).
- **A copy next to your page**: `enform-embed.js`, built with the app (`bun run build`,
  in `dist/`) and served by every instance. Your page then depends on nobody.

On a Tangled site, for example: a repo with an `index.html` loading it, pushed, is
served at `https://<you>.tngl.io/<repo>/`.

## Publish

    bun run embed:package          # builds packages/enform/enform-embed.js
    cd packages/enform
    npm version patch              # or minor, major
    npm publish                    # builds it again first (prepublishOnly)

## What it does

- Reads the repo from its own PDS, in the visitor's browser: no server, no account,
  nothing written. As enform does, it resolves handles and lexicons through the
  services in `src/lib/config/app.json` (DNS over HTTPS, a handle resolver) and asks
  for link previews (`services.linkCards`).
- Its styles are enform's, in the element's shadow root: the page's styles don't reach
  it, and its own don't leak out. It follows the visitor's light or dark mode.
- Media play in the reader, as in enform: on a page with a Content Security Policy,
  allow the players' scripts and frames (`csp` in `src/lib/config/app.json`).

## How it is built

`vite.embed.config.ts` compiles `src/embed/` with enform's components, without
SvelteKit: `src/embed/paths.ts` turns enform's paths into links to the instance,
`src/embed/session.ts` stands for a session with no one signed in, and the reader starts
as a bar. One ES module, its media players in it.
