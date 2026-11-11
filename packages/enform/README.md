# @internet4000/enform

`<enform-embed>`: someone's profile in an [atproto](https://atproto.com) app, on any web
page. The app, whose profile it is, a shelf per type of record their repo has there,
and a reader to read or play them; each record links to its page in
[enform](https://enform.internet4000.com). Read-only, from the repo's own PDS, in the
visitor's browser: no server, no account.

```html
<script type="module" src="https://cdn.jsdelivr.net/npm/@internet4000/enform@0"></script>
<enform-embed actor="hwww.org" app="4000.radio"></enform-embed>
```

- `actor`: whose profile, a handle or a DID.
- `app` (optional): the app, by its domain (`4000.radio`, `tangled.org`, `bsky.app`);
  without it, all their apps, each opening in place.
- `enform` (optional): the enform instance its links go to (default:
  `https://enform.internet4000.com/`).

One ES module, its dependencies and media players in it. From npm
(`npm install @internet4000/enform`, then `import '@internet4000/enform'`), a CDN, or a
copy next to your page. More: [docs/embed.md](https://github.com/internet4000/enform/blob/main/docs/embed.md).

License: [GPL-3.0](./LICENSE).
