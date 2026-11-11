# enform

Describes the atmosphere as best it can: from record types (their lexicons, else their
records) and what can be inferred from them, it generates a super app of all apps:
every app's screens, cards, forms and reader, with no code written for any one app.
Reading and writing your own records (CRUD) is one of its abilities. For people on
atproto, including newcomers to decentralized apps.

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

- data-models-in-cms: the app directory and config are JSON in `src/lib/config`, not
  yet in Sveltia CMS.

Read docs/principles.md (atproto rules, writing and permissions), docs/architecture.md
(data → capabilities → kinds → presenters → descriptions), docs/local-first.md,
docs/self-host.md (any host, any folder: no instance of ours to trust) and
docs/embed.md (<enform-embed>, a profile's home in an app on any page), docs/examples.md
(apps made from their types alone) and docs/cli.md (the engine in a terminal).
Larger work in plan.md.

## Commands

    bun run dev        # http://127.0.0.1:5173
    bun run verify     # formatting, types, unit tests, build: before every commit
    bun run test:e2e   # local atproto network, Playwright, the UI quality gate
    bun run enform     # the description engine: describe, check (docs/cli.md)
    git push           # main: GitHub Pages builds and publishes (docs/self-host.md)
    bun run deploy     # Cloudflare, serving enform.internet4000.com until its DNS moves

## Git

Work on `main`, commit atomically once `bun run verify` passes, push, and end commit
messages with the `Co-Authored-By` line of the agent.
