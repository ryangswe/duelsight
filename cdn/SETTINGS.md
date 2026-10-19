# Settings file contract (`config.json`), schema version 1

The DuelSight extension reads one small JSON file from the project's CDN domain to decide where
card images come from. Changing this file, not shipping an extension release, is how images are
turned off or moved between paths on the host the extension already has permission for. A new
image host needs an extension release (see "Image hosts").

This document states what the extension enforces (`src/settings/`, `src/images/chain.ts`); a
file that `opcdn.py` accepts can still have parts the extension drops.

- **URL:** `<cdnBase>/config.json`, where `cdnBase` is the one value in `duelsight.config.json` that
  names the CDN host (a placeholder, `https://cdn.duelsight.invalid`, until the domain is decided).
- **Served with:** `Content-Type: application/json`, `Cache-Control: public, max-age=300`,
  `Access-Control-Allow-Origin: *`.
- **Written by:** `opcdn.py publish --config <file>`, last, after any images it references.

## Shape

```json
{
  "schemaVersion": 1,
  "updatedAt": "2026-10-16T00:00:00Z",
  "namesOnly": false,
  "primary": { "id": "cdn", "template": "https://cdn.duelsight.invalid/art/{art}" },
  "fallbacks": []
}
```

| Field | Type | Meaning |
|---|---|---|
| `schemaVersion` | integer, exactly `1` | Any other value: treat the file as unusable (see "Failure rules"). Later fields are added without bumping it; a bump means a breaking change. |
| `updatedAt` | ISO-8601 UTC string | **Required** (a string; any other type makes the file unusable). Otherwise informational. |
| `namesOnly` | boolean | **Kill switch.** `true`: show no image from any source, only the card's name. Wins over every other field. |
| `primary` | source object or `null` | Our own CDN. **Required** (`null` is a value). `null` skips it (e.g. after a complaint), leaving the fallbacks. |
| `fallbacks` | array of source objects | Tried in order after `primary` fails or is `null`. May be empty. |
| `update` | object, optional | For installs that never update by themselves (an unpacked folder from a release zip). `{ "latest": "x.y.z", "url": "https://…" }`: when the running extension's version is lower than `latest`, the popup shows one dismissible "New version available" line linking to `url`. Dismissed per version; a later `latest` shows it again. `latest` must be three dot-separated integers, and `url` must be the project's releases page or an address below it (`https://github.com/ryangswe/duelsight/releases`, `…/releases/…`). Absent, `null` or malformed: the field is ignored and the rest of the file is still used. It does not bump `schemaVersion`. |

A **source object** is `{ "id": string, "template": string }`, `id` not empty. An object of
another shape, in `primary` or `fallbacks`, makes the whole file unusable. `id` names the source
in logs and the dev UI. The extension does not branch on it.

## Templates

A template is an absolute `https://` URL with placeholders, substituted per card. A template
with a placeholder not in this table (or unbalanced braces) is unusable: its source is dropped,
the rest kept.

| Placeholder | Value | Encoding |
|---|---|---|
| `{art}` | the catalog entry's `art` path, e.g. `89631139.jpg` | each `/`-separated segment percent-encoded, slashes kept |
| `{file}` | the last segment of `{art}` | percent-encoded |
| `{cardId}` | the catalog card id | percent-encoded |
| `{printedId}` | the number printed on the card, or none (below) | percent-encoded |

**`{printedId}`.** The card id is a YGOPRODeck passcode: 1 to 8 digits. `{printedId}` is the id
itself when it matches `^\d{1,8}$`; any other id has none. One name can have several artworks
(image ids); the release's identity groups make them one identity, so the id shape is not a
per-artwork rule. A nine-digit id is not a passcode.

| Card id | `{printedId}` |
|---|---|
| `89631139`, `46986414` | `89631139`, `46986414` |
| `4031928`, `5` | `4031928`, `5` |
| `012345678` | none |
| `token_1`, `89631139_p1` | none |

**Unavailable placeholder → skip the source.** A card whose `art` is `null` cannot use a
template with `{art}` or `{file}`; a card with no printed number cannot use `{printedId}`. The
extension skips that source for that card and tries the next, else shows names. `{cardId}` is
always available.

## Image hosts

The extension requests images only from hosts in its manifest's host permissions, today
`cdn.duelsight.invalid` alone, the placeholder host (YouTube and twitch.tv are the sites it runs on, not image hosts); its pages'
Content-Security-Policy (`connect-src`) allows only that host, so a redirect to another host
fails too. A `primary` or fallback whose
template names any other host is dropped (the rest kept). **A new image host needs an extension
release** that adds the host permission.

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
  unknown placeholder, or names a host the extension may not request (see "Image hosts"). A malformed `update`
  is ignored; so are the retired `cardLink` and `geometric` fields, whatever they hold.
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
