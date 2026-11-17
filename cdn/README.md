# Card-art CDN (`cdn/`)

Serves Yu-Gi-Oh! card images for the DuelSight extension from the project's own Cloudflare
account and domain (the host in `cdnBase` of `duelsight.config.json`,
`cdn.duelsight.com`), the card details file for the tooltip's details panel, and the small settings file
(`config.json`, contract in [SETTINGS.md](SETTINGS.md)) that tells the extension where images
and details come from.

- **Why a separate account and domain:** a complaint from a rights holder reaches only this
  project's service, and the whole thing can be handed to a maintainer (account, domain,
  settings file).
- **What this folder never holds:** images or card text. They stay on the maintainer's machine
  and go from there straight to R2. No repository carries them.
- **Who may publish:** the owner. A publish needs the account's R2 token; nothing here runs in CI.

## Layout on the CDN

| Key | What | Cache-Control |
|---|---|---|
| `art/<art path>` | the image, original bytes, path = the catalog's `art` value (e.g. `89631139.jpg`) | `public, max-age=86400` |
| `art/index.json` | every uploaded path with sha256 and size: the tool's record of what is live | `no-cache` |
| `art/tooltip/<cardId>.webp` | the tooltip picture: the card's art made 640 px wide in WebP (see Usage) | `public, max-age=86400` |
| `art/tooltip/index.json` | every tooltip picture with its sha256, its source's sha256 and the set's spec | `no-cache` |
| `data/details-<sha8>.json` | the card details file (type, stats, text), from `scripts/card-details.mjs` | `public, max-age=31536000, immutable` |
| `config.json` | the extension's settings ([SETTINGS.md](SETTINGS.md)) | `public, max-age=300` |
| `privacy.html` | the privacy policy as a page (PRIVACY.md, from `scripts/privacy-page.mjs`): the store listing's privacy-policy link | `public, max-age=3600` |

The publishing tool is the toolkit's `cardvision cdn` ([its guide](https://github.com/ryangswe/riftsight-vision/blob/main/docs/cdn.md)),
driven by this product's [cdn.config.json](cdn.config.json): the environment prefix `DSCDN`, the
details file as the one data file, `privacy.html` as the one page, no geometric stage.

Uploads are additive: the tool never deletes. Order is images → tooltip pictures →
`art/index.json` and `art/tooltip/index.json` → the details file (with `--data-file`) → the page
(with `--page`) → `config.json` (with `--config`, and if everything before it landed).

## One-time setup (maintainer, about 30 minutes)

1. **A new Cloudflare account** under an email you would be willing to hand over, not linked to
   any other project's account.
2. **A domain, bought in that account** (Cloudflare Registrar, about $10 a year), neutral: no
   game or publisher name in it. The images will be served from `cdn.<domain>`. Put the
   host in `cdnBase` in `duelsight.config.json` (the one place), and in `cdn/config.json`.
3. **R2** (Dashboard → R2; Cloudflare asks for a payment method even on the free tier): create a
   bucket (any name, e.g. `card-art`), location Automatic. Leave the `r2.dev` public URL **disabled**.
   Bucket → Settings → Custom Domains → connect `cdn.<domain>`.
4. **CORS** (bucket → Settings → CORS policy), so the extension and YouTube/Twitch pages can
   read `config.json`:
   ```json
   [{ "AllowedOrigins": ["*"], "AllowedMethods": ["GET", "HEAD"], "AllowedHeaders": ["*"], "MaxAgeSeconds": 3600 }]
   ```
5. **An R2 API token** (R2 → Manage R2 API Tokens → Create): permission *Object Read & Write*,
   **scoped to that one bucket**. Copy the Access Key ID, the Secret Access Key and the account
   ID shown on the R2 page.
6. **On your machine**, `cdn/.env` (gitignored; never paste the values into a chat or an issue):
   ```
   DSCDN_R2_ACCOUNT_ID=…
   DSCDN_R2_ACCESS_KEY_ID=…
   DSCDN_R2_SECRET_ACCESS_KEY=…
   DSCDN_BUCKET=<bucket name>
   DSCDN_PUBLIC_BASE=https://cdn.duelsight.com   # the cdnBase value
   DSCDN_EXTENSION_IDS=<store id>,<unpacked id>   # verify-release-live checks CORS for each
   ```
7. **Domain:** `cdn.duelsight.com` on duelsight.com. It appears in `cdnBase` in `duelsight.config.json`, the `primary` template
   in `cdn/config.json`, `cdn/SETTINGS.md` and its `DSCDN_PUBLIC_BASE`. Change them together.
8. **Network Error Logging off.** Turn off Network Error Logging for the zone (or strip NEL/Report-To
   with a response header transform rule); verify checks it. Otherwise every viewer's browser
   sends error reports to a Cloudflare host the extension does not otherwise contact.

Handing over later: the maintainer becomes an administrator of the Cloudflare account and you
leave it; the domain transfers with the account. Whoever owns the domain owns `config.json`,
which is where images come from.

## Usage

From the repository's root (the tool reads `cdn/cdn.config.json` there):

```bash
python3 -m venv cdn/.venv && cdn/.venv/bin/pip install -r cdn/requirements.txt
CDN=cdn/.venv/bin/cardvision
CATALOG=<the release's catalog JSON>   # entries with an id and an `art` path
IMAGES=<the folder of card images>    # the `art` paths are relative to it

# 1. Offline check: every art path exists, is a real jpg/png, nothing escapes the folder
$CDN cdn plan --offline --catalog $CATALOG --images $IMAGES

# 2. Against the live bucket, upload nothing
$CDN cdn publish --env-file cdn/.env --catalog $CATALOG --images $IMAGES --config cdn/config.json --dry-run

# 3. Publish (images, tooltip pictures, indexes, then config.json)
$CDN cdn publish --env-file cdn/.env --catalog $CATALOG --images $IMAGES --config cdn/config.json

# 4. Check what is served: config contract, headers, CORS, sampled images by sha256
$CDN cdn verify --env-file cdn/.env
```

- **A new set:** once the catalog refresh has added the images, re-run steps 2–4.
  Only new or changed files are uploaded, the tooltip pictures included. Then rebuild the card
  details file (below).
- **The tooltip pictures:** `art.derived` in
  [cdn.config.json](cdn.config.json) lists one set, `tooltip`: each card's art made 640 px wide
  in WebP (quality 75), at `art/tooltip/<cardId>.webp` with its own index (the toolkit's
  docs/cdn.md, "Derived art sets"). Steps 2–4 make and upload it with the full art, and redo only
  the cards whose art changed. The tooltip asks for it once the settings point at it, in a
  publish of its own after the set is complete:
  1. Steps 2–4 as above, with the current `config.json`. `verify` shows the set's index and checks
     a few of its files.
  2. In a copy of `config.json`, set `primary` to
     `{"id": "tooltip", "template": "https://cdn.duelsight.com/art/tooltip/{cardId}.webp"}`, written
     exactly so (no other placeholder, extension, query or fragment), and `fallbacks` to the full
     art, `[{"id": "cdn", "template": "https://cdn.duelsight.com/art/{art}"}]`. Then
     `$CDN cdn publish --env-file cdn/.env --catalog $CATALOG --config <the copy> --dry-run`, the
     same without `--dry-run`, and `$CDN cdn verify --env-file cdn/.env --catalog $CATALOG`, which
     now also fails if a card with art is missing from the set. The publish is refused, dry run
     included, unless the set lists every catalog card with art at the current spec.
  3. A pull request makes the copy `cdn/config.json`. That file is also the extension's built-in
     settings ([docs/development.md](../docs/development.md)), so the next store build asks for the
     tooltip pictures too. The same pull request updates the settings test that pins `primary` and
     `fallbacks` (`test/settings.test.ts`) and the example in [SETTINGS.md](SETTINGS.md).

  While the settings point at the set, every publish of `config.json` takes `--catalog`:
  `publish --config` (with or without `--images` or `--data-file`), and `publish-release --config`
  with the catalog of the release the pointer will name (`<release folder>/catalog.json`), after
  the art publish has made that release's new cards' pictures. A `config.json` that no longer
  points under `art/tooltip/` (back to the full art as `primary`, or `primary: null`) is published
  without `--catalog` unless the same run uploads art with `--images`; `publish-release` refuses
  `--catalog` with it. A card without art has no tooltip picture,
  so each time it shows the tooltip misses and falls back to the full art; three misses in a row
  skip the tooltip pictures until the settings are read again. Three catalog cards have no art.
- **The card details file:** build it outside the repository, from the one-time card list and the
  release's catalog, then publish it with `config.json` naming it:
  ```bash
  node scripts/card-details.mjs --cards <cardinfo JSON> --catalog $CATALOG --out <folder outside the repository>
  # prints the file's path, size and the "details" entry: put that entry in cdn/config.json
  $CDN cdn publish --env-file cdn/.env --data-file <out>/data/details-<sha8>.json --config cdn/config.json --dry-run
  $CDN cdn publish --env-file cdn/.env --data-file <out>/data/details-<sha8>.json --config cdn/config.json
  $CDN cdn verify --env-file cdn/.env
  ```
  While `config.json` points at the tooltip pictures, add `--catalog $CATALOG` to both publishes.
  `publish` refuses a `config.json` that does not name the file being published. Removing
  `details` from `config.json` and publishing it turns the details panel off for everyone.
- **The privacy page** (after any change to PRIVACY.md, and before a store submission): write it
  outside the repository and publish it on its own; `verify` checks it is served as HTML.
  ```bash
  node scripts/privacy-page.mjs --out <folder outside the repository>
  $CDN cdn publish --env-file cdn/.env --page <out>/privacy.html --dry-run
  $CDN cdn publish --env-file cdn/.env --page <out>/privacy.html
  $CDN cdn verify --env-file cdn/.env
  ```
- **Switching images off or over:** edit `config.json` (`namesOnly: true` shows names without pictures; `primary: null`
  with no `fallbacks` stops images entirely), then `$CDN cdn publish --env-file cdn/.env --config cdn/config.json`
  (config only; add `--catalog $CATALOG` when the file being published points at the tooltip
  pictures, and not otherwise) and `verify`. Installed extensions follow within about an hour.
- **A replaced image** (e.g. a better scan) reaches viewers within a day; purge its URL in the
  Cloudflare dashboard (Caching → Configuration → Custom Purge) to make it immediate.
- **Exit codes:** 0 ok; 1 failed uploads or verify failures; 3 refused by a guard (nothing
  uploaded).

## Guards

- Credentials are read only from `DSCDN_*` variables. The run is refused if the account or key
  equals another project's `R2_*` values found in the environment, or if the bucket or public
  base names one of the other projects in `forbiddenWords` ([cdn.config.json](cdn.config.json)).
- Every catalog `art` path must be a clean relative path to a jpg/png/webp under `--images`
  (no `..`, no symlink escapes), at most 5 MB, whose bytes match its type.
- `config.json` must pass the SETTINGS.md schema; its `primary` must be on `DSCDN_PUBLIC_BASE`;
  no template may point at those other projects. A template under `art/tooltip/` must be exactly
  `https://cdn.duelsight.com/art/tooltip/{cardId}.webp`, and is refused unless
  `art/tooltip/index.json` lists every catalog card with art at the set's current spec (`--catalog`
  needed) and `tooltip` is still in `art.derived`.
- A details file must be named `details-<sha8>.json` after its own SHA-256 and be a schema 1
  details file; a `config.json` published with it must name it (path and SHA-256).
- A `config.json` that names a details file it is not published with (`publish --config`, or
  `publish-release --set-pointer`) is refused, dry run included, unless that file is already on the
  CDN with exactly those bytes; the refusal names the live config's entry.
- A page must be one of `pages` in `cdn.config.json` (`privacy.html`), an HTML document, with no
  script, event handler or `javascript:` link.
- A failed image upload leaves it out of `art/index.json` (a re-run retries it) and blocks
  `config.json`. So does a tooltip picture that cannot be made or is 5 MB or larger, which stays out
  of `art/tooltip/index.json`.

The toolkit's own tests run all of this offline with no credentials (`python -m pytest
tests/test_cdn_*.py` in a checkout of the toolkit).
