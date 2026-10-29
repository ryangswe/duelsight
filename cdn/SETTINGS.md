# Settings file contract (`config.json`), schema version 1

The DuelSight extension reads one small JSON file from the project's CDN domain to decide where
card images come from, which card details file the tooltip's details panel uses, and which
card-recognition release installs run (see "The release pointer"). Changing this file, not shipping an
extension release, is how images are turned off or moved between paths on the host the extension
already has permission for, and how new cards reach installed copies. A new image host needs an
extension release (see "Image hosts").

This document states what the extension enforces (`src/settings/`, `src/images/chain.ts`); a
file that `cardvision cdn` accepts can still have parts the extension drops.

- **URL:** `<cdnBase>/config.json`, where `cdnBase` is the one value in `duelsight.config.json` that
  names the CDN host (`https://cdn.duelsight.com`).
- **Served with:** `Content-Type: application/json`, `Cache-Control: public, max-age=300`,
  `Access-Control-Allow-Origin: *`.
- **Written by:** `cardvision cdn publish --config <file>`, last, after any images it references.

## Shape

```json
{
  "schemaVersion": 1,
  "updatedAt": "2026-10-16T00:00:00Z",
  "namesOnly": false,
  "primary": { "id": "cdn", "template": "https://cdn.duelsight.com/art/{art}" },
  "fallbacks": [],
  "details": { "path": "data/details-2442d28d.json", "sha256": "2442d28d…(64 hex digits)" },
  "detailsFr": { "path": "data/details-fr-be968315.json", "sha256": "be968315…(64 hex digits)" }
}
```

| Field | Type | Meaning |
|---|---|---|
| `schemaVersion` | integer, exactly `1` | Any other value: treat the file as unusable (see "Failure rules"). Later fields are added without bumping it; a bump means a breaking change. |
| `updatedAt` | ISO-8601 UTC string | **Required** (a string; any other type makes the file unusable). Otherwise informational. |
| `namesOnly` | boolean | **Kill switch.** `true`: show no image from any source, only the card's name. Wins over every other field. |
| `primary` | source object or `null` | Our own CDN. **Required** (`null` is a value). `null` skips it (e.g. after a complaint), leaving the fallbacks. |
| `fallbacks` | array of source objects | Tried in order after `primary` fails or is `null`. May be empty. |
| `details` | object, optional | The card details file for the tooltip's details panel (see "The card details file"). `{ "path": "data/details-<sha8>.json", "sha256": "<64 hex digits>" }`: `path` is relative to this file's address (so on the same host), a clean relative path to a `.json` file (no leading `/`, no `.` or `..` segment); `sha256` is the file's SHA-256 in lowercase hex. Absent or `null`: no details panel, pictures alone, and a copy the extension kept is deleted. Malformed: ignored, the rest of the file still used. It does not bump `schemaVersion`; an older extension ignores it. |
| `detailsFr` | object, optional | The French card details file (see "The French card details file"), for browsers whose top preferred language is French. The same shape and rules as `details`. Used only while `details` is named too; absent, `null` or malformed: every browser gets the English file. An older extension ignores it. It does not bump `schemaVersion`. |
| `release` | object, optional | The card-recognition release installs run instead of their bundled one; see "The release pointer". Absent, `null` or malformed: the bundled release (a malformed one never makes the file unusable). It does not bump `schemaVersion`; an older extension ignores it. |
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
`cdn.duelsight.com` alone (YouTube and twitch.tv are the sites it runs on, not image hosts); its pages'
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
  is ignored; so are the retired `cardLink` and `geometric` fields, whatever they hold. A malformed
  `release` is ignored (the bundled release is used).
- **Image requests** carry no cookies and no referrer. An image counts as loaded only once the
  browser has decoded its bytes; its type is never taken from the file name.

## The release pointer (`release`)

New cards reach installed copies without a store update: the settings file may name a
card-recognition release published on this host, and a qualifying install loads it instead of the
release bundled in the extension. The release is data only (JSON and ONNX files); code stays in the
package. Anything wrong with it, at any step, loads the bundled release. The extension's side is
the vendored `remote-release.js` (the toolkit's `browser/src/remote/`) and `src/compute/frame.ts`;
the publishing side is `cardvision cdn publish-release`.

```json
"release": {
  "id": "0123456789abcdef",
  "path": "vision/releases/0123456789abcdef/release.json",
  "sha256": "<64 hex: SHA-256 of release.json's bytes as served>",
  "minimumExtensionVersion": "0.3.0"
}
```

| Field | Rule | Meaning |
|---|---|---|
| `release` | object, optional; absent or `null`: no pointer | The release every qualifying install runs instead of its bundled one. |
| `id` | `^[0-9a-f]{16}$` | The release id (the hash of its canonical document; the runtime checks it). |
| `path` | **exactly** `vision/releases/<id>/release.json` (string equality) | Resolved against this file's address, so always this host. No scheme, `..`, `%2e` or query. |
| `sha256` | `^[0-9a-f]{64}$` | SHA-256 of the document's bytes, checked before the worker starts. |
| `minimumExtensionVersion` | `x.y.z`, **required** | A running version below it ignores the whole field. The first pointer-aware DuelSight is 0.3.0. |
| `maximumExtensionVersion` | `x.y.z`, optional, **exclusive** | A running version at or above it ignores the whole field. Left out unless a downgrade window needs it. |
| unknown keys inside `release` | ignored | Forward compatibility (another product's `geometric` among them). |

A store build bundles the release the pointer names when it is built, so a fresh install loads
nothing (rule 4).

### Rules the extension enforces

The compute frame reads the settings in effect once per page, at its start (the first hover on a
page with card hovers on; nothing happens at install). **A page tries the remote release at most
once; every fallback goes to the bundled release and never back.**

| # | Condition | Outcome | Log reason |
|---|---|---|---|
| 1 | `release` absent or `null` | bundled (the request is byte-for-byte what it was before pointers) | `absent` |
| 2 | malformed (the rules above; `id` not the id in `path`) | field ignored, rest of the file kept: bundled | `malformed:<key>` |
| 3 | running version below the minimum, or at or above the maximum | bundled | `version` |
| 4 | `id` is the bundled release's id | bundled, **nothing downloaded** | `same-as-bundled` |
| 5 | the skip-list holds `(id, sha256)`, less than 24 h old | bundled | `skipped:<reason>` |
| 6 | the document: network error, non-2xx, or 10 s for all of it | bundled | `unreachable` / `http-<n>` |
| 7 | SHA-256 of the document is not `sha256` (after one re-fetch past the cache) | bundled; skip-listed | `doc-sha` |
| 8 | the document is not JSON, its `id` is not `id`, or a pinned path is not a flat name `^[A-Za-z0-9][A-Za-z0-9._-]*$` | bundled; skip-listed | `doc-shape` |
| 9 | a file download fails, is non-2xx, or stalls (30 s with no bytes; no cap on the total) | bundled | `unreachable:<file>` |
| 9b | a downloaded file's size or SHA-256 is not the document's (after one re-fetch past the cache) | bundled; skip-listed | `file-sha:<file>` |
| 10 | the worker refuses the release (`release-status.ok` false) | a new worker, bundled; skip-listed only as below | `runtime:<reason>` |
| 11 | the worker loaded another id than the pointer's | that worker ended, a new one, bundled; skip-listed | `id-mismatch` |
| 12 | the worker fails after loading a remote release | its one restart loads the bundled release | `worker-restart` |

**Skip-list.** `chrome.storage.local["releaseSkip"]` holds one entry `{id, sha256, reason, at}`, or
none. It is recorded for rules 7, 8, 9b and 11, and for rule 10 only when the refusal came before the
worker said it was preparing the models (the files and their bindings were judged then); never
for network failures (6, 9), refusals after that point, the runtime's catch-all (`unexpected:`), the
frame's own errors (a worker that did not start) or worker crashes. Before a document or file
SHA-256 failure is recorded, that URL is fetched once more with `cache: "reload"`. A new entry
replaces the old one. The entry is cleared when the pointer names another `(id, sha256)` (so a
later move back to it is tried again), when `release` is absent, and when it is 24 h old.

**File reuse.** Each of the five files the remote document pins that has the same SHA-256 and size
as a file of the bundled release is taken from the extension, under the remote document's name;
every other file is downloaded from `vision/releases/<id>/<path>`. The runtime checks every file,
reused or downloaded, against the remote document. A card-only update reuses both models and
downloads the bank, the identity groups and the catalog.

**Downloads** are made by the compute frame with `credentials: "omit"`, `referrerPolicy:
"no-referrer"` and `cache: "default"` (the release's files are immutable, so a later page reads them
from the browser's cache), read as streams; while they run, the page shows its usual loading state.

**Workers.** The fallback of rules 10 and 11 is a planned replacement, not a restart: the bundled
worker then has the usual budget (a failure to load turns recognition off for the page; a crash
after loading, one restart).

**Card facts.** The tooltip's table of names (`data/cards.json`) is built from the bundled catalog,
so a card new in a remote release would be recognized and then shown as nothing. The compute frame
therefore builds the same table (`buildCardTable` of the vendored `remote-release.js`, the build's own rule) from the catalog
it hands the worker, before the load, and adopts it only when the worker confirms that release's
id. With each card it shows from that release, it posts the card's facts (`{releaseId, cardId,
facts: {name, set, art}}`) on `BroadcastChannel("duelsight-card-facts")`, then sends the card, with
the release id, through the page as before. The channel reaches the extension's own pages (other
tabs' frames too) and no web page. A tooltip frame that has a card of a remote release to show and
not its facts (made again, or the card came first) asks on the channel (`{want: true, releaseId,
cardId}`); the compute frame of that release answers for a card it has shown (the last 256) and
for nothing else, and facts that arrive for the card on show replace what it showed. A file is read
no further than its pinned size, and the document no further than 256 KB. The tooltip looks a card up in the
facts it received for that release first, then in its bundled table; an id in neither is waited for
300 ms, then shows nothing. The page can post card messages to the tooltip frame, but it cannot reach
the channel, so it can never make the tooltip show a name or picture that a compute frame did not
send. The facts are checked on arrival (strings of at most 200 characters, a clean relative art
path); every later lookup for the card on show (its details panel too) uses them.

**Logging** (local, never sent): one `console.info` line per decision in the compute frame,
`[DuelSight] release source=remote|bundled reason=<code> pointer=<id|-> bundled=<id> reused=<k>/5
downloaded=<bytes> ms=<n>`, where `downloaded` counts decoded bytes. Never the page's address, the
channel, the video, frames or cards. Dev builds add `release` to `__duelsightDebug`.

**Once per frame.** "Once per page" is once per compute frame: if the page removes the frame, a new
one decides again.

**Pickup.** A running browser picks a pointer move up within about 1 h 5 min (the hourly settings
fetch plus this file's 5-minute cache), or at its next start. Rolling back is pointing back to an
earlier release, or removing the field.

### The release folder on the CDN

| Key | Content-Type | Cache-Control |
|---|---|---|
| `vision/releases/<id>/release.json` (written last within the folder) | `application/json` | `public, max-age=31536000, immutable` |
| `vision/releases/<id>/{detector,recognizer}.onnx` | `application/octet-stream` | immutable, as above |
| `vision/releases/<id>/{bank,identity-groups,catalog}.json` (the document's own names) | `application/json` | immutable |
| `vision/releases/<id>/LICENSE`, `NOTICE` / `PROVENANCE.md` | `text/plain; charset=utf-8` / `text/markdown; charset=utf-8` | immutable |
| `vision/releases/index.json` (the tool's record; not part of this contract) | `application/json` | `no-cache` |

The full pinned set is uploaded even when the extension would reuse some of it. Every object
carries `Metadata: {sha256}`. Folders are never overwritten or deleted. JSON should be served
compressed (the bank and catalog are most of a card-only update).

### Publishing a release

`cardvision cdn publish-release --release <folder named after its id> --min-version 0.3.0 [--data-file F]
[--config cdn/config.json --set-pointer] [--sessions] [--dry-run]`:

1. **Seal:** the document parses, its id is the folder's name, every pinned file is a flat name
   present with its size and SHA-256, and `release-legal/` names this release (`NOTICE`'s first
   line, as for a build); then `vendor/cardvision-browser/node/verify-release.mjs`, the vendored runtime's own
   checks (`--sessions` also starts both ONNX Runtime sessions in Node: use it whenever a model
   changed).
2. **Runtimes:** every extension version in `cdn/RUNTIMES.json` that the pointer would reach must
   run the release's ONNX Runtime major.minor; otherwise raise `--min-version`. A release that needs
   a newer runtime ships bundled in a store release first, and the pointer moves at least 14 days
   later.
3. **Remote state, through the S3 API only** (never the public URL, so no 404 is cached at the
   edge): missing files are uploaded, identical ones skipped, and another file's bytes under one of
   the keys refuse the whole run before anything is written.
4. **Upload** the files, then `release.json`; each is checked with HEAD.
5. **Verify live** (`verify-release-live`): the document over https, the runtime's checks on the
   served files, each file's SHA-256, type, cache rule, no NEL, CORS for each real extension id
   (`DSCDN_EXTENSION_IDS`) and compression. Then the card details file of this catalog (`--details`).
6. **Pointer:** the `release` block is computed from what was verified (`--set-pointer` writes it
   into the config file), and `config.json` is uploaded last.

`cardvision cdn publish --config F` refuses a `release` that does not verify live, so a pointer only ever
moves to a verified folder, a rollback included. `cardvision cdn verify-release-live` checks the live
pointer at any time.

### What the pins do not guard against

The SHA-256 pins guard against corruption, stale caches and partial uploads. They do not guard
against someone who controls the CDN bucket or zone, who could publish a self-consistent folder and
pointer. Such a person can only choose among folders on this host (the path rule and the extension's
content security policy fix the host) and change data, never code: scripts and WebAssembly are in
the package. Card names are shown as text. Keep the CDN tokens narrowly scoped (one bucket, object
read and write) and on the maintainer's machine.

## The card details file

Each card's type line, attribute, level, rank or link rating, ATK and DEF, and text, for the
tooltip's details panel (the format is in `src/details/details.ts`). Card text is the rights
holder's, like the art: the file is never committed or put in the extension's package.

- **Made by:** `node scripts/card-details.mjs --cards <cardinfo JSON> --catalog <the release's
  catalog.json> --out <folder outside the repository>`, which writes `data/details-<sha8>.json`
  (`sha8`: the leading 8 hex digits of its SHA-256) and prints the `details` entry for this file.
- **Key:** `data/details-<sha8>.json`, a new name for every change: a file is never replaced in
  place. **Served with** `Content-Type: application/json`, `Cache-Control: public,
  max-age=31536000, immutable`.
- **Written by:** `cardvision cdn publish --data-file <file> --config <file>`: the details file before
  `config.json`, and `config.json` when it names that file (path and SHA-256), else nothing.
- **The extension** fetches it while its details panel is on (never when it is off), from the settings file's own
  host, with no cookies and no referrer, once: it keeps the file in its own Cache Storage, keyed
  by its address, and uses it when its bytes match `sha256` (never otherwise) (checked on every read). A new
  `details` entry replaces the kept copy; until a file is loaded, and for a card it does not
  list, the tooltip shows the picture alone.
- **Switching it off:** remove `details` (or set it to `null`) and publish `config.json`.
  Installed extensions stop showing details and delete their copy within about an hour.

## The French card details file

The same rows as the card details file, with each card's name, type line, attribute and text in
French where an official French text exists, and English where not (`lang` and `names` fields;
the format is in `src/details/details.ts`). Browsers whose top preferred language is French
(`fr`, `fr-CA`, ...) load it in place of the English file; the tooltip then shows the French name
with the English name under it.

- **Its sources:** Yugipedia's French names and texts (official printed texts; CC BY-SA 4.0, so
  the file carries an `attribution` and is offered under that license), else YGOPRODeck's French
  when it has no English in it, else English. Type lines and attributes use Konami's French terms
  (`scripts/localized-terms.mjs`). Never a fan translation: a card with no official French stays
  English.
- **Made by:** `node scripts/yugipedia-fetch.mjs --lang fr --out <folder>` (at most once every 30
  days into the same folder, as Yugipedia asks: about 35 requests, 3 seconds apart, through its
  API), then `node scripts/localized-details.mjs --lang fr --details <the English details file>
  --yugipedia <that folder> --ygoprodeck <cardinfo JSON with language=fr> --catalog <the release's
  catalog.json> --out <folder outside the repository>`. It writes `data/details-fr-<sha8>.json`
  and prints the `detailsFr` entry.
- **Key, serving and writing:** as the card details file (`dataFiles.detailsFr` in
  `cdn.config.json`): `cardvision cdn publish --data-file <file> --config <file>` uploads it
  before `config.json`.
- **Switching it off:** remove `detailsFr` and publish `config.json`: French browsers get the
  English file within about an hour.

## Images on our CDN

- Key: `art/<art path>`, exactly the catalog's `art` value (original bytes, as mirrored). The
  `Content-Type` comes from the bytes, not the name: some `.jpg` files hold PNG or WebP bytes.
  Uploads are additive; a card's file is never deleted by the tool.
- `Cache-Control: public, max-age=86400`. A replaced image (e.g. a new scan) reaches viewers
  within a day; purge the URL in the Cloudflare dashboard to make it immediate.
- `art/index.json` lists every uploaded path with its sha256 and size. It is the tool's record,
  not part of this contract; the extension does not need it.
