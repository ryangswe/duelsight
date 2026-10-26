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
| `data/details-<sha8>.json` | the card details file (type, stats, text), from `scripts/card-details.mjs` | `public, max-age=31536000, immutable` |
| `config.json` | the extension's settings ([SETTINGS.md](SETTINGS.md)) | `public, max-age=300` |
| `privacy.html` | the privacy policy as a page (PRIVACY.md, from `scripts/privacy-page.mjs`): the store listing's privacy-policy link | `public, max-age=3600` |

Uploads are additive: the tool never deletes. Order is images → `art/index.json` → the details
file (with `--details`) → the page (with `--page`) → `config.json` (with `--config`, and if
everything before it landed).

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

```bash
cd cdn
python3 -m venv .venv && .venv/bin/pip install -r requirements.txt
CATALOG=<the release's catalog JSON>   # entries with an id and an `art` path
IMAGES=<the folder of card images>    # the `art` paths are relative to it

# 1. Offline check: every art path exists, is a real jpg/png, nothing escapes the folder
.venv/bin/python dscdn.py plan --offline --catalog $CATALOG --images $IMAGES

# 2. Against the live bucket, upload nothing
.venv/bin/python dscdn.py publish --env-file .env --catalog $CATALOG --images $IMAGES --config config.json --dry-run

# 3. Publish (images, index, then config.json)
.venv/bin/python dscdn.py publish --env-file .env --catalog $CATALOG --images $IMAGES --config config.json

# 4. Check what is served: config contract, headers, CORS, sampled images by sha256
.venv/bin/python dscdn.py verify --env-file .env
```

- **A new set:** once the catalog refresh has added the images, re-run steps 2–4.
  Only new or changed files are uploaded. Then rebuild the card details file (below).
- **The card details file:** build it outside the repository, from the one-time card list and the
  release's catalog, then publish it with `config.json` naming it:
  ```bash
  node ../scripts/card-details.mjs --cards <cardinfo JSON> --catalog $CATALOG --out <folder outside the repository>
  # prints the file's path, size and the "details" entry: put that entry in config.json
  .venv/bin/python dscdn.py publish --env-file .env --details <out>/data/details-<sha8>.json --config config.json --dry-run
  .venv/bin/python dscdn.py publish --env-file .env --details <out>/data/details-<sha8>.json --config config.json
  .venv/bin/python dscdn.py verify --env-file .env
  ```
  `publish` refuses a `config.json` that does not name the file being published. Removing
  `details` from `config.json` and publishing it turns the details panel off for everyone.
- **The privacy page** (after any change to PRIVACY.md, and before a store submission): write it
  outside the repository and publish it on its own; `verify` checks it is served as HTML.
  ```bash
  node ../scripts/privacy-page.mjs --out <folder outside the repository>
  .venv/bin/python dscdn.py publish --env-file .env --page <out>/privacy.html --dry-run
  .venv/bin/python dscdn.py publish --env-file .env --page <out>/privacy.html
  .venv/bin/python dscdn.py verify --env-file .env
  ```
- **Switching images off or over:** edit `config.json` (`namesOnly: true` shows names without pictures; `primary: null`
  with no `fallbacks` stops images entirely), then `publish --env-file .env --config config.json`
  (config only) and `verify`. Installed extensions follow within about an hour.
- **A replaced image** (e.g. a better scan) reaches viewers within a day; purge its URL in the
  Cloudflare dashboard (Caching → Configuration → Custom Purge) to make it immediate.
- **Exit codes:** 0 ok; 1 failed uploads or verify failures; 3 refused by a guard (nothing
  uploaded).

## Guards

- Credentials are read only from `DSCDN_*` variables. The run is refused if the account or key
  equals another project's `R2_*` values found in the environment, or if the bucket or public
  base names one of the other projects in the tool's `FORBIDDEN_WORDS` list.
- Every catalog `art` path must be a clean relative path to a jpg/png/webp under `--images`
  (no `..`, no symlink escapes), at most 5 MB, whose bytes match its type.
- `config.json` must pass the SETTINGS.md schema; its `primary` must be on `DSCDN_PUBLIC_BASE`;
  no template may point at those other projects.
- A details file must be named `details-<sha8>.json` after its own SHA-256 and be a schema 1
  details file; a `config.json` published with it must name it (path and SHA-256).
- A `config.json` that names a details file it is not published with (`publish --config`, or
  `publish-release --set-pointer`) is refused, dry run included, unless that file is already on the
  CDN with exactly those bytes; the refusal names the live config's entry.
- A page must be one of the names the tool serves (`privacy.html`), an HTML document, with no
  script, event handler or `javascript:` link.
- A failed image upload leaves it out of `art/index.json` (a re-run retries it) and blocks
  `config.json`.

`dscdn.py selftest` runs all of this offline with no credentials.
