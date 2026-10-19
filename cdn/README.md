# Card-art CDN (`cdn/`)

Serves One Piece Card Game images for the Kenbunshoku extension from the project's own
Cloudflare account and domain (`cdn.kenbunshoku.com`), plus the small settings file
(`config.json`, contract in [SETTINGS.md](SETTINGS.md)) that tells the extension where images
come from.

- **Why a separate account and domain:** a complaint from a rights holder reaches only this
  project's service, and the whole thing can be handed to a maintainer (account, domain,
  settings file).
- **What this folder never holds:** images. They stay on the maintainer's machine, in the card
  mirror, and go from there straight to R2. No repository carries them.

## Layout on the CDN

| Key | What | Cache-Control |
|---|---|---|
| `art/<art path>` | the image, original bytes, path = the catalog's `art` value (e.g. `OP01-001.png`, `jp/…png`) | `public, max-age=86400` |
| `art/index.json` | every uploaded path with sha256 and size: the tool's record of what is live | `no-cache` |
| `config.json` | the extension's settings ([SETTINGS.md](SETTINGS.md)) | `public, max-age=300` |
| `vision/geo/<source-16>/` | the geometric stage's packed card-feature index (below) | `public, max-age=31536000, immutable` |

Uploads are additive: the tool never deletes. Order is images → `art/index.json` →
`config.json` (only with `--config`, and only if every image landed).

## One-time setup (maintainer, about 30 minutes)

1. **A new Cloudflare account** under an email you would be willing to hand over, not linked to
   any other project's account.
2. **A domain, bought in that account** (Cloudflare Registrar, about $10 a year), neutral: not
   not "One Piece". The images will be served from `cdn.<domain>`.
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
   OPCDN_R2_ACCOUNT_ID=…
   OPCDN_R2_ACCESS_KEY_ID=…
   OPCDN_R2_SECRET_ACCESS_KEY=…
   OPCDN_BUCKET=<bucket name>
   OPCDN_PUBLIC_BASE=https://cdn.kenbunshoku.com
   ```
7. **Domain:** `kenbunshoku.com`; images and `config.json` are served from
   `cdn.kenbunshoku.com`. The live settings are `config.json` in this folder.
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
CATALOG=<the card mirror's catalog JSON>   # entries with an id and an `art` path
IMAGES=<the card mirror's image folder>    # the `art` paths are relative to it

# 1. Offline check: every art path exists, is a real jpg/png, nothing escapes the folder
.venv/bin/python opcdn.py plan --offline --catalog $CATALOG --images $IMAGES

# 2. Against the live bucket, upload nothing
.venv/bin/python opcdn.py publish --env-file .env --catalog $CATALOG --images $IMAGES --config config.json --dry-run

# 3. Publish (images, index, then config.json)
.venv/bin/python opcdn.py publish --env-file .env --catalog $CATALOG --images $IMAGES --config config.json

# 4. Check what is served: config contract, headers, CORS, sampled images by sha256
.venv/bin/python opcdn.py verify --env-file .env
```

- **A new set:** once the card mirror has added the images and the catalog, re-run steps 2–4.
  Only new or changed files are uploaded.
- **Switching images off or over:** edit `config.json` (`namesOnly: true`, or `primary: null`
  to fall back to the community server), then `publish --env-file .env --config config.json`
  (config only) and `verify`. Installed extensions follow within about an hour.
- **A replaced image** (e.g. a better scan) reaches viewers within a day; purge its URL in the
  Cloudflare dashboard (Caching → Configuration → Custom Purge) to make it immediate.
- **Exit codes:** 0 ok; 1 failed uploads or verify failures; 3 refused by a guard (nothing
  uploaded).

## The geometric index (`vision/geo/`)

The extension's extra-accuracy stage downloads a packed card-feature index (`cardvision
pack-features`: `manifest.json` and eight `shard-N.bin`, about 60 MB) from
`https://cdn.kenbunshoku.com/vision/geo/<first 16 hex of the source index's sha256>/`. The
extension pins the manifest's SHA-256 (`geometric.manifestSha256` in `kenbunshoku.config.json`), and
the manifest pins every shard. A folder never changes content: a new index gets a new folder,
and the extension is released with the new address and pin.

```bash
# What would be uploaded, against the live bucket (uploads nothing)
.venv/bin/python opcdn.py publish-geo --env-file .env --dir <packed folder> --expect-sha256 <manifest sha256> --dry-run

# Upload: the shards, each checked by HEAD (size, SHA-256, type, caching), then manifest.json
# only when every shard checks out
.venv/bin/python opcdn.py publish-geo --env-file .env --dir <packed folder> --expect-sha256 <manifest sha256>

# Read it back over HTTPS: bytes, Cache-Control, CORS for an extension origin
.venv/bin/python opcdn.py verify-geo --env-file .env --dir <packed folder> --expect-sha256 <manifest sha256>
```

- The folder name comes from the manifest's `source.sha256`; the run is refused when the
  manifest's own SHA-256 is not `--expect-sha256`, or a shard does not match the manifest.
- Objects: `application/json` (manifest) and `application/octet-stream` (shards),
  `Cache-Control: public, max-age=31536000, immutable`, and the SHA-256 in the object's
  metadata. An object already there with the same bytes and metadata is kept; one with other
  bytes refuses the whole run before anything is uploaded (nothing is ever overwritten). One
  with the same bytes but the wrong Content-Type or Cache-Control is reported and refuses the
  run; `--fix-metadata` then rewrites its metadata in place (a copy onto itself; the bytes never
  change).
- When a shard fails to upload or to check, `manifest.json` is not uploaded: a manifest is never
  live before all its shards are. A re-run uploads what is missing.
- `verify-geo` (and `verify`) fail when the CDN sends `NEL` or `Report-To` headers (step 8).
- The bucket's CORS policy (setup step 4) covers these files too; the extension's worker reads
  them from its own origin.
- **The release B2 index:** folder `vision/geo/cd676903704f456d/`, manifest SHA-256
  `7b9a96f636611e34183b1a845db93846cb92e5d12ad0d273dd14d1e2c60cef19`.

## Guards

- Credentials are read only from `OPCDN_*` variables. The run is refused if the account or key
  equals another project's `R2_*` values found in the environment, or if the bucket or public
  base names one of the other projects in the tool's `FORBIDDEN_WORDS` list.
- Every catalog `art` path must be a clean relative path to a jpg/png/webp under `--images`
  (no `..`, no symlink escapes), at most 5 MB, whose bytes match its type.
- `config.json` must pass the SETTINGS.md schema; its `primary` must be on `OPCDN_PUBLIC_BASE`;
  no template may point at those other projects.
- A failed image upload leaves it out of `art/index.json` (a re-run retries it) and blocks
  `config.json`.

`opcdn.py selftest` runs all of this offline with no credentials.
