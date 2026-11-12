# Your own instance

enform is static files: no server, no database, no account of its own. Every repo is
read from its own PDS, and writes go from your browser to your PDS. Anyone can serve
their own copy, so nobody has to trust ours.

## Build

    bun install
    ORIGIN=https://example.org BASE_PATH=/enform bun run build

- `ORIGIN`: where the instance is served (default: `https://` + `domain` in
  `src/lib/config/app.json`).
- `BASE_PATH`: the folder it lives in, if not the domain's root (default: none).

Upload `dist/` to any static host. It contains:

Every page of the app is one file, `index.html`: what is open is in its address after
`#` (`…/#/@alice.bsky.social/apps/bsky.app`), the part of a URL a browser never sends.
The host sees that the app was opened, never whose repo, which app or what record.

- `client-metadata.json`: the instance's OAuth client metadata (written when built).
  Sign-ins come back to the app's page, their answer in its query. Its URL
  (`ORIGIN` + `BASE_PATH` + `/client-metadata.json`) is the instance's client ID: each
  instance is its own client, and PDSes show its address when you approve a write.
  Keep that address stable, or people approve it again.
- `404.html`: the app again, which static hosts serve for paths they have no file for,
  so a link from before addresses moved after `#` still opens: `address.js` moves its
  path there, in place (`…/@alice/apps/bsky.app` → `…/#/@alice/apps/bsky.app`).
- `enform-embed.js`: `<enform-embed>`, linking to this instance (docs/embed.md).

## Deploy from a fork

- **GitHub Pages**: in the fork's settings, Pages › Source: GitHub Actions. Each push
  to `main` runs `.github/workflows/pages.yml`: the end-to-end suite (`e2e.yml`), then
  the build, whose address (a custom domain included) comes from the Pages settings.
- **GitLab Pages**: `.gitlab-ci.yml` publishes on the default branch, at the project's
  Pages address.
- **Anywhere else**: build with your `ORIGIN` and `BASE_PATH`, upload `dist/`.

## Make it yours

`src/lib/config/app.json` holds the name, the services enform talks to (PLC directory,
DNS over HTTPS, relay, link cards, maps), and the media players the Content Security
Policy allows. `src/lib/config/apps.json` is the directory of known apps.
