# enform

A universal app for the atmosphere: read your own PDS data and create, edit and delete
records in any app, with forms generated from lexicons, and explore other people and
their collections. For people on atproto, including newcomers to decentralized apps.

Objectives: CRUD of any record in your own repo, with forms that follow the lexicon
(generic patterns for every field: links, images, rich text, places); discover and
follow apps, people and collections; always clear which app (its domain), whose data
and who you act as.
Never: a hack of the protocol (only what the atproto specs define); a server or a
cost (static, read from each repo's own PDS); an app deciding for people (inferred
views can always be changed); asking for more permission than the action at hand.
People: someone new to atproto who wants to try an app; a Radio4000/Bluesky user
managing their own records; a developer checking what their lexicon looks like.

Follows https://hwww.gitlab.io/savoir/agents.md (local: ~/src/hwww/savoir). Exceptions, on purpose:

- hosting: Cloudflare Workers static assets with Wrangler (wrangler.jsonc), because the
  cf CLI doesn't build SvelteKit yet.
- data-models-in-cms: the app directory and config are JSON in `src/lib/config`, not
  yet in Sveltia CMS.

Read docs/principles.md (atproto rules, writing and permissions), docs/architecture.md
(data → capabilities → kinds → presenters → descriptions) and docs/local-first.md.
Larger work in plan.md.

## Commands

    bun run dev        # http://127.0.0.1:5173
    bun run verify     # formatting, types, unit tests, build: before every commit
    bun run test:e2e   # local atproto network, Playwright, the UI quality gate
    bun run deploy     # build and wrangler deploy to enform.internet4000.com

## Git

Work on `main`, commit atomically once `bun run verify` passes, push, and end commit
messages with the `Co-Authored-By` line of the agent.
