<!-- SPDX-License-Identifier: Apache-2.0 -->
# Maintaining DuelSight

Light upkeep: new cards, and a refresh when the cardvision models improve. Everything DuelSight
depends on sits in accounts of its own, so a new maintainer can take it over.

## New cards

1. **Catalog refresh.** Rebuild the catalog from the card source (YGOPRODeck's catalog, requested
   politely: one request for the list, each image once, throttled; never Konami's database, which
   is linked to but not read). Check it with the cardvision toolkit's catalog checks. Ids are
   passcodes; every artwork of one name is one identity.
2. **Bank rows for new cards.** With the release's recognizer, embed the new cards' art and add
   rows to the bank and the identity groups (toolkit: `build-release`; then `verify-release`,
   which prints the 16-hex-digit release id). Replay the toolkit's held-out check: rows for
   existing cards should not change the result.
3. **Card details file.** Rebuild it from the card list and the new release's catalog, into a
   folder outside the repository: `node scripts/card-details.mjs --cards <cardinfo JSON>
   --catalog <release folder>/catalog.json --out <folder>`. It prints the file's new versioned
   name and the `details` entry for `cdn/config.json`; put that entry there. Card text is the
   rights holder's: the file is never committed or packaged.
4. **CDN publish, by the owner.** Publish the new art, the details file (`--details`) and
   `config.json` with `cdn/dscdn.py` (`plan`, `publish --dry-run`, `publish`, `verify`; see
   [cdn/README.md](cdn/README.md)). Publishing is the owner's step: it needs the CDN account's token.
5. **Extension release.** Put the new release folder through `npm run build -- --release <folder>`
   (the build checks it), update `release-legal/` (`NOTICE`'s opening line names the release id),
   bump `version` in `package.json`, `npm test`, `npm run build -- --store --release <folder>`,
   `npm run package`, and upload the zip to the Chrome Web Store. Cards in the catalog but not in
   an installed copy's release are not recognized until the release is installed.

## A core-model refresh

When the cardvision toolkit publishes a better detector or recognizer, or a new runtime:

1. Build a release folder from the new models (`cardvision build-release`) and verify it. Measure
   it on a fresh held-out set before shipping; a release that was not measured says so in
   [docs/accuracy.md](docs/accuracy.md).
2. If the runtime changed, vendor the new commit: `node scripts/vendor-runtime.mjs --repo <toolkit
   checkout> --commit <sha> --opencv <OpenCV.js build>` (see [docs/development.md](docs/development.md);
   the build copies none of OpenCV into the extension). Keep `onnxruntime-web` in `package.json` at
   the version `vendor/cardvision-browser/VENDOR.json` names. Run `npm test`.
3. Update `release-legal/` (license, notice, provenance of the models) and ship as above.

## Accounts to transfer in a handoff

Each is separate from every other project's, so it can change hands whole:

- **Domain** (the CDN host in `cdnBase` of `duelsight.config.json`, once decided; a placeholder
  until then).
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
