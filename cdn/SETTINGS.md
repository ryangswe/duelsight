# Settings file contract (`config.json`), schema version 1

The Kenbunshoku extension reads one small JSON file from the project's CDN domain to decide where
card images come from. Changing this file, not shipping an extension release, is how images are
switched to the community server, turned off, or moved between the hosts the extension already
has permission for. A new image host needs an extension release (see "Image hosts").

This document states what the extension enforces (`src/settings/`, `src/images/chain.ts`); a
file that `opcdn.py` accepts can still have parts the extension drops.

- **URL:** `https://cdn.kenbunshoku.com/config.json`.
- **Served with:** `Content-Type: application/json`, `Cache-Control: public, max-age=300`,
  `Access-Control-Allow-Origin: *`.
- **Written by:** `opcdn.py publish --config <file>`, last, after any images it references.

## Shape

```json
{
  "schemaVersion": 1,
  "updatedAt": "2026-10-16T00:00:00Z",
  "namesOnly": false,
  "primary": { "id": "cdn", "template": "https://cdn.kenbunshoku.com/art/{art}" },
  "fallbacks": [
    { "id": "optcgapi", "template": "https://optcgapi.com/media/static/Card_Images/{sourceFile}" }
  ],
  "cardLink": "https://en.onepiece-cardgame.com/cardlist/?freewords={printedId}"
}
```

| Field | Type | Meaning |
|---|---|---|
| `schemaVersion` | integer, exactly `1` | Any other value: treat the file as unusable (see "Failure rules"). Later fields are added without bumping it; a bump means a breaking change. |
| `updatedAt` | ISO-8601 UTC string | **Required** (a string; any other type makes the file unusable). Otherwise informational. |
| `namesOnly` | boolean | **Kill switch.** `true`: show no image from any source, only the card's name. Wins over every other field. |
| `primary` | source object or `null` | Our own CDN. **Required** (`null` is a value). `null` skips it (e.g. after a complaint), leaving the fallbacks. A primary whose template uses `{sourceFile}` is dropped (our CDN is keyed by `{art}`). |
| `fallbacks` | array of source objects | Tried in order after `primary` fails or is `null`. May be empty. |
| `cardLink` | any | **Obsolete: ignored by 0.1.0 and later**, whatever it holds, and no longer required (the tooltip is the card's picture alone and has no link). Earlier development builds required it (a template string or `null`), so the published file keeps it for now. |
| `geometric` | boolean, optional | The extension's extra-accuracy stage (the runtime's geometric stage, WebGPU only, with a card-feature index of about 60 MB on this CDN). Absent or `null`: on. `false`: off, without a release; the index is not downloaded, from the next page a video is hovered on. Any other value is ignored (on), and the rest of the file is still used. |
| `update` | object, optional | For installs that never update by themselves (an unpacked folder from a release zip). `{ "latest": "x.y.z", "url": "https://…" }`: when the running extension's version is lower than `latest`, the popup shows one dismissible "New version available" line linking to `url`. Dismissed per version; a later `latest` shows it again. `latest` must be three dot-separated integers, and `url` must be the project's releases page or an address below it (`https://github.com/ryangswe/kenbunshoku/releases`, `…/releases/…`). Absent, `null` or malformed: the field is ignored and the rest of the file is still used. It does not bump `schemaVersion`. |

A **source object** is `{ "id": string, "template": string }`, `id` not empty. An object of
another shape, in `primary` or `fallbacks`, makes the whole file unusable. `id` names the source
in logs and the dev UI, and selects the bundled file-name map for `{sourceFile}` (below). The
extension does not otherwise branch on it.

## Templates

A template is an absolute `https://` URL with placeholders, substituted per card. A template
with a placeholder not in this table (or unbalanced braces) is unusable: its source is dropped,
the rest kept.

| Placeholder | Value | Encoding |
|---|---|---|
| `{art}` | the catalog entry's `art` path, e.g. `OP01-001.png` or `jp/P-001_p1.png` | each `/`-separated segment percent-encoded, slashes kept |
| `{file}` | the last segment of `{art}` | percent-encoded |
| `{cardId}` | the catalog card id | percent-encoded |
| `{printedId}` | the number printed on the card, or none (below) | percent-encoded |
| `{sourceFile}` | this source's own file name for the card, from a map bundled in the extension keyed by the source's `id` (`{ "<source id>": { "<cardId>": "<file name>" } }`, text only) | percent-encoded |

**`{printedId}`.** From the card id: drop a trailing `-JP`, then a trailing variant suffix
`-r<n>` or `-pr<n>`; split on `_`; take the first part shaped like a card number,
`^[A-Z]{1,4}\d{0,2}-\d{2,3}[A-Z]?$`. If no part matches, the card has no printed number: the
`{printedId}` is unavailable for it. DON!! cards (`don_8`) have none.

| Card id | `{printedId}` |
|---|---|
| `OP01-060`, `OP10-045_p2`, `EB01-003__promo1` | `OP01-060`, `OP10-045`, `EB01-003` |
| `EB01-006_p4-JP`, `P-011-JP` | `EB01-006`, `P-011` |
| `OP09-078-r1`, `P-089-pr6` | `OP09-078`, `P-089` |
| `EB03_OP05-006_p1` | `OP05-006` (the set prefix is not a number) |
| `don_8` | none |

**Unavailable placeholder → skip the source.** A card whose `art` is `null` cannot use a
template with `{art}` or `{file}`; a card absent from the source's map (or a source id with no
map) cannot use `{sourceFile}`; a card with no printed number cannot use `{printedId}`. The
extension skips that source for that card and tries the next, else shows names. `{cardId}` is
always available.

The `{sourceFile}` map ships inside the extension, not on the CDN, so the fallback keeps working
when the CDN is down. Adding a source that needs a map therefore needs an extension release;
sources using only `{cardId}`/`{printedId}` on a host the extension already has do not.

## Image hosts

The extension requests images only from hosts in its manifest's host permissions, today
`cdn.kenbunshoku.com` and `optcgapi.com`; its pages' Content-Security-Policy (`connect-src`)
allows only those, so a redirect to another host fails too. A `primary` or fallback whose
template names any other host is dropped (the rest kept). **A new image host needs an extension
release** that adds the host permission.

**`cardLink` value (obsolete, ignored by 0.1.0 and later):**
`https://en.onepiece-cardgame.com/cardlist/?freewords={printedId}`, kept in the published file
for earlier development builds, which required the field.

## Resolution per hover

1. `namesOnly` is `true` → the card's name. Stop.
2. For `primary` (if not `null`), then each `fallbacks` entry in order: build the URL; skip it
   if a placeholder it needs is unavailable; load the image; on success show it and stop. A
   load failure (network error, non-2xx, decode error, or 5 s timeout) moves to the next.
3. Nothing loaded → the card's name.

A source that failed may be skipped for the rest of the session after 3 consecutive failures;
re-try it after a fresh `config.json` read.

## Failure rules

- **Fetch:** at extension install and browser start-up, then at most once an hour while running:
  when a tooltip frame opens, when a card is newly shown, and when the popup opens, if the last
  attempt is an hour old. The attempt is recorded even when it fails. The request carries no
  cookies and no referrer and is given up on after 10 s. Keep the last good copy in extension
  storage; it is validated again on every read.
- **Unreachable, non-2xx, malformed JSON, `schemaVersion` ≠ 1, or a required field missing or of
  the wrong type:** keep using the last good copy; with none, use the built-in default (a copy of
  the shipped `config.json` bundled in the extension).
- **Unknown extra fields:** ignore them.
- **Dropped, the rest kept:** a source whose template is not an absolute `https://` URL, has an
  unknown placeholder, or names a host the extension may not request (see "Image hosts"); a
  `primary` that uses `{sourceFile}`. A malformed `update` is ignored, and `cardLink` always is
  (obsolete).
- **Image requests** carry no cookies and no referrer. An image counts as loaded only once the
  browser has decoded its bytes; its type is never taken from the file name.

## Images on our CDN

- Key: `art/<art path>`, exactly the catalog's `art` value (original bytes, as mirrored). The
  `Content-Type` comes from the bytes, not the name: some `.jpg` files hold PNG or WebP bytes.
  Uploads are additive; a card's file is never deleted by the tool.
- `Cache-Control: public, max-age=86400`. A replaced image (e.g. a new scan) reaches viewers
  within a day; purge the URL in the Cloudflare dashboard to make it immediate.
- `art/index.json` lists every uploaded path with its sha256 and size. It is the tool's record,
  not part of this contract; the extension does not need it.
