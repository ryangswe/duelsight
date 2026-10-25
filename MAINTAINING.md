<!-- SPDX-License-Identifier: Apache-2.0 -->
# Maintaining DuelSight

Light upkeep: new cards, and a refresh when the cardvision models improve. Everything DuelSight
depends on sits in accounts of its own, so a new maintainer can take it over.

## New cards

New cards reach installed copies (0.3.0 and later) through the settings file's release pointer
([cdn/SETTINGS.md](cdn/SETTINGS.md), "The release pointer"), with no store update. About once a
month, on a fixed day:

1. **Catalog refresh.** Rebuild the catalog from the card source (YGOPRODeck's catalog, requested
   politely: one request for the list, each image once, throttled; never Konami's database, which
   is linked to but not read). New cards are appended; existing entries keep their ids and art.
   Check it with the cardvision toolkit's catalog checks. Ids are passcodes; every artwork of one
   name is one identity.
2. **Bank rows for new cards.** With the live release's recognizer, embed the new cards' art and
   append rows to the bank (`cardvision build-bank --base`, then `cardvision check-refresh`: every
   existing row byte-identical, the bank version raised), then `cardvision build-release` into a
   folder named after the new release id. Look at a handful of the new cards' images before going on.
3. **The regression check.** Run the maintainer's pre-registered replay against the live release:
   it must find nothing that worked broken, on real footage and on generated scenes, and the new
   cards must work about as well as cards the models never trained on. A release that fails is not
   published. Its rules are fixed in advance and are not changed after seeing a result.
4. **Legal files.** Update `release-legal/` for the new release id (the opening line of `NOTICE` names it;
   PROVENANCE.md says what was added). They are published beside the release's files.
5. **Card details file.** Rebuild it from the card list and the new release's catalog, into a
   folder outside the repository: `node scripts/card-details.mjs --cards <cardinfo JSON>
   --catalog <release folder>/catalog.json --out <folder>`. It prints the file's versioned name and
   the `details` entry for `cdn/config.json` (step 6 writes both entries with `--set-pointer`). Card
   text is the rights holder's: the file is never committed or packaged.
6. **Publish.** The new art (`dscdn.py publish --catalog … --images …`), then the release:
   `dscdn.py publish-release --release <folder> --min-version 0.3.0 --details <file> --config
   cdn/config.json --set-pointer` (try it with `--dry-run` before). It uploads the release folder, verifies it
   live, publishes the details file, and moves the pointer in `config.json` last. Commit the changed
   `cdn/config.json`. Publishing needs the CDN account's token: it is the owner's step, or the
   maintainer's under a standing permission the owner gave for updates that add cards and nothing else, which
   applies once the owner has published the opening two pointer moves.
7. **Confirm** after about an hour (`dscdn.py verify-release-live`; a hover on a new card). Rolling
   back is publishing the previous `release` block, or removing it.

The next store release bundles the release the pointer names then, so fresh installs download
nothing. Installs older than 0.3.0, and zip installs that never update, keep the cards of their
bundled release until they are updated. A new model (a retrain) is a core-model refresh, below,
not a monthly card update.

## Store submission

[docs/store-listing.md](docs/store-listing.md) holds every field of the Chrome Web Store dashboard,
paste-ready, and how to make what it uploads:

- the package (`npm run package` on a `--store` build);
- the privacy page at `<cdnBase>/privacy.html`, generated from PRIVACY.md by
  `scripts/privacy-page.mjs` and published with `cdn/dscdn.py publish --page` (republish it
  whenever PRIVACY.md changes: the listing links to it);
- the five screenshots and the two promo tiles, made from the real extension by
  `scripts/store-assets.mjs` (layouts and headlines in `scripts/store-templates.mjs`), written
  outside the repository (they hold card art and frames of others' videos).

Submitting, and every declaration in the dashboard, is the owner's.

## A core-model refresh

When the cardvision toolkit publishes a better detector or recognizer, or a new runtime:

1. Build a release folder from the new models (`cardvision build-release`) and verify it. Measure
   it on a fresh held-out set before shipping; a release that was not measured says so in
   [docs/accuracy.md](docs/accuracy.md).
2. If the runtime changed, vendor the new commit: `node scripts/vendor-runtime.mjs --repo <toolkit
   checkout> --commit <sha> --opencv <OpenCV.js build>` (see [docs/development.md](docs/development.md);
   the build copies none of OpenCV into the extension). Keep `onnxruntime-web` in `package.json` at
   the version `vendor/cardvision-browser/VENDOR.json` names. Run `npm test`.
3. Update `release-legal/` (license, notice, provenance of the models). A release with new models
   can be published through the pointer like a card update (`publish-release --sessions`, after its
   held-out measurement), or bundled in a store release: one that needs a newer runtime ships bundled
   in a store release, and the pointer moves at least 14 days later, with `--min-version` raised to that version.
   Add a row to `cdn/RUNTIMES.json` with every store release.

## Accounts to transfer in a handoff

Each is separate from every other project's, so it can change hands whole:

- **Domain** (`duelsight.com`; the CDN host `cdn.duelsight.com` is `cdnBase` in
  `duelsight.config.json`).
- **Cloudflare account** (R2 bucket, custom domain, CORS policy; the settings file `config.json`
  lives there, so whoever owns it controls where images come from).
- **GitHub repository** (this code, issues, releases; `updateUrlPrefix` and `projectUrl` in the
  config point at it).
- **Hugging Face repositories** (the models and labels, when published).
- **Chrome Web Store listing** (in the publisher's account; a transfer may mean a new listing).
  The settings file's `update` field can point installed copies to a new listing or release page.

Changing hands also means: a new extension key pair for unpacked installs (the old private key
goes with the old owner), `projectUrl` and `maintainerContactUrl` in the config, and the contact
in the store listing.

## Safe by default

If a complaint arrives, the settings file can turn pictures off at once (`namesOnly: true`),
drop the CDN source (`primary: null`) or stop naming the card details file (remove `details`;
installed copies then delete their copy) without an extension release; installed copies follow
within about an hour. See [cdn/SETTINGS.md](cdn/SETTINGS.md).
