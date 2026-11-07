# enform

Your AT Protocol data, as an app. Open any account to browse its collections and
records, shown through the lexicons their collections publish. Creating, editing and
deleting records with forms generated from those lexicons comes next.

A static SvelteKit app with no backend: every repo is read from its own PDS.
See [docs/principles.md](docs/principles.md) for how enform keeps to the atproto specs.

## Develop

```sh
bun install
bun run dev      # http://127.0.0.1:5173
bun run test
bun run types
bun run build    # static site in dist/
```

## Layout

- `src/lib/atproto/`: identity (DNS, DID documents) and public repo reads
- `src/lib/lexicons/`: lexicon resolution and refs
- `src/lib/records/`: how record values are summarized and shown
- `src/lib/forms/`: record forms from lexicons: initial values, constraints, cleaning, validation
- `src/lib/components/`: `enform-*` elements (`form/`: the generated record form)
- `src/lib/config/app.json`: services and settings
- `i18n/messages/`: translations
