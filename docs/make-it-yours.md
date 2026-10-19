<!-- SPDX-License-Identifier: Apache-2.0 -->
# Make it yours: an extension for another card game

*[Back to README](../README.md)*

Kenbunshoku is Apache-2.0. Its recognition is not specific to One Piece: the models, the bank
and the card list all come from the release folder. What makes this build Kenbunshoku (its
names, sites, hosts, addresses and the rule for printed numbers) is in one file,
`kenbunshoku.config.json`. The build checks it and refuses a file with a problem, saying which.
To make the same extension for another card game, copy this repository, edit that file, add
your release and its legal files, and build.

**You need:**

- a release folder for your game, as the cardvision toolkit's adapt guide makes it
  (`cardvision build-release`; check it with `cardvision verify-release`, which prints its
  16-hex-digit id). The toolkit and its
  [adapt guide](https://github.com/ryangswe/riftsight-vision/blob/main/docs/adapt-your-game.md)
  are at [ryangswe/riftsight-vision](https://github.com/ryangswe/riftsight-vision);
- the license, notice and provenance of your models;
- either a web host for your card pictures, **for pictures you have the right to serve**, or
  nothing: the extension can show names only.

These steps were checked on the runtime's toy release (20 cards): with names only, the
extra-accuracy stage off, no host at all and Twitch only, the copy's tests passed, it built, and
in Chrome for Testing on the local test page it named the cards under the pointer, requesting
nothing beyond the local server.

1. **Copy the repository, then `npm ci` and `npm test`.** The tests read
   `kenbunshoku.config.json`, so they stay green as you change it. Tests of Kenbunshoku's own
   values (its ID, its CDN, its release) are skipped in a copy whose `packageName` is not
   `kenbunshoku`. One test fails until you change both the `packageName` (step 2) and the
   extension's key (step 6): a copy must not keep one of Kenbunshoku's and not the other.
   Every run of `npm test` also prints `DOMException` lines and stack traces before its
   summary ("Failed to load iframe page ... Iframe page loading is disabled.", from the
   happy-dom test environment): they are harmless when the summary says every test passed.

2. **Edit `kenbunshoku.config.json`.** Its keys are explained at the top of
   `scripts/fork-config.mjs`. In short:
   - `name`, `shortName`, `description`: your extension's names (manifest, popup, store);
     `packageName`: the release zip's name.
   - `icons`: a folder holding `icon-16.png`, `icon-32.png`, `icon-48.png` and `icon-128.png`
     (`node scripts/icons.mjs` redraws Kenbunshoku's).
   - `videoSites`: `{ "youtube": true|false, "twitch": true|false }`. The manifest's sites
     and the pages the extension's frames accept follow it.
   - `imageHosts`: every host the extension may request (card pictures, the settings file,
     the card-feature index). They become its host permissions and the only hosts its pages
     may connect to. `[]` for none.
   - `settingsUrl`: the address of your hosted settings file, or `null`: the extension then
     fetches nothing and uses the copy built into it (step 4).
   - `printedNumber`: how the number printed on a card is found, available to image addresses
     as `{printedId}`: `{ "regex": "…" }` (its first capture group,
     matched on the card id), `"catalog"` (an optional `printed` field on each card in your
     catalog), or `"none"`.
   - `outlineColor` and `outlineGlowColor` (optional): the hovered card's outline, a solid edge
     and the glow fading out around it, as CSS colors (defaults `"#1b2f6b"` navy, `"rgba(61, 111, 224, 0.6)"` blue).
   - `geometric`: the extra-accuracy stage, or `null` for off (step 5).
   - `projectUrl` and `runtimeUrl`: the popup's two links (keep `runtimeUrl`: it credits the
     runtime). `updateUrlPrefix`: where a "New version available" line may link, or `null`
     for never. `modelUrl`, `maintainerContactUrl`: yours, or `null`.

3. **Your models.** Pass your release folder to the build with `--release`. Rewrite
   `release-legal/` for your models: `LICENSE` (your models' license), `NOTICE`, whose first
   line must contain `(id <your release id>)` (the build refuses any other release), and
   `PROVENANCE.md` (what the models were trained and built from). Release files are never
   committed. The card's name (the picture's alt text, and what shows without a picture)
   comes from the release's catalog. Replace `data/source-files.json` with `{}` (it maps One Piece cards to
   file names on `optcgapi.com`) and build without `--images-index`. The build still prints a
   line such as `{sourceFile} map from data/source-files.json: optcgapi 0 of 20 cards`: that is
   expected in a copy that does not use that host.

4. **Card pictures: choose one.** `cdn/config.json` is the settings file built into the
   extension, used when no fetch has succeeded (always, with `settingsUrl` `null`).
   - **Names only.** Set `"namesOnly": true`, `"primary": null`, `"fallbacks": []`,
     and `"geometric": false`. The tooltip then shows each card's name.
   - **Either way, set `"cardLink": null`.** The file still holds `cardLink`, a One Piece
     address. It is obsolete: the extension never reads it, so it has no effect, but it should
     not name One Piece in your copy. `null` is the clean value: `cdn/opcdn.py` accepts it
     silently, and only warns if the key is left out altogether
     ([cdn/SETTINGS.md](../cdn/SETTINGS.md)).
   - **Your own image host.** Follow [cdn/SETTINGS.md](../cdn/SETTINGS.md), the settings file's
     contract. Serve each picture at a path made from the catalog's `art` value (for example
     `https://<your host>/art/{art}`), serve `config.json` beside it with
     `Access-Control-Allow-Origin: *`, set `primary` to that template and drop the `optcgapi`
     fallback. Put the host in `imageHosts` and the file's address in `settingsUrl`.
     `cdn/opcdn.py` publishes to Cloudflare R2 ([cdn/README.md](../cdn/README.md)); read its
     guards before you reuse it, since they name other projects. Any static host that serves
     the same files works too.

5. **Extra accuracy (the geometric stage), on or off.**
   - **Off:** `"geometric": null` in the config. The build then needs no
     `data/geometric.json` (delete it), asks for no unlimited storage and ships no OpenCV.
   - **On:** `geometric.settings` names the stage's settings file; choose yours on data you do
     not test on (adapt guide, tier 2, step 7). Build the card-feature index from the bank in
     your release, `cardvision build-features --config <settings> --catalog <catalog> --art
     <card images> --bank <your release's bank> --pin`, and pack it with
     `cardvision pack-features --index <index> --out <folder> --config <settings>`. Host the
     folder on a host in `imageHosts` and never change what it holds. Set the settings file's
     `index.path` to the address of its `manifest.json`, and `geometric.manifestSha256` to that
     file's SHA-256. A dev build can point at a local copy with `--geo-manifest-url`. An index
     built for another bank is refused, and the stage turns itself off.

6. **Your own extension ID.** Builds carry `keys/unpacked-public.pem` as the manifest's `key`,
   which fixes the ID of unpacked installs. Do not reuse it: make your own key pair, keep the
   private key out of the repository, and commit the public one. The ID follows from it.
   These commands write the private key to `../private-key.pem`, the folder above your copy,
   outside the repository:

   ```
   openssl genrsa -out ../private-key.pem 2048
   openssl rsa -in ../private-key.pem -pubout -out keys/unpacked-public.pem
   ```

   **Never commit the private key**, and keep it somewhere safe: anyone who has it can publish
   an extension that carries your ID. `.gitignore` ignores every `.pem` file except
   `keys/unpacked-public.pem`, as a guard, but do not rely on that: keep the private key
   outside the repository.

   A `--store` build leaves the key out; the Chrome Web Store assigns its own ID.

7. **Delete the One Piece text** that no longer applies: the README and the pages in `docs/` (the figures in
   [accuracy.md](accuracy.md) are for the One Piece models only: measure your own), `PRIVACY.md` (rewrite it
   for your hosts), and `cdn/README.md` if you do not use `cdn/opcdn.py`. Keep `LICENSE` and
   the attributions in `NOTICE`, and add your own.

8. **Build, load and check on a local video.** Use a video file of your own game:

   ```
   npm test
   npm run build -- --dev --release <your release folder>
   npm run manual -- --video /path/to/clip.mp4
   ```

   In Chrome, open `chrome://extensions`, turn on **Developer mode**, click **Load unpacked**
   and choose `dist/`. Open the address the server prints (`http://127.0.0.1:8770/`), turn card
   hovers on with the button in the player, and rest the pointer on a card.
   `test/smoke/smoke.mjs` does the same headlessly (see [Manual check on a local video](development.md#manual-check-on-a-local-video)). Then
   try a video on the sites you turned on. A release build is the same command without
   `--dev`, and `npm run package` zips it.

9. **Before a store listing.** Build with `--store` and package that. Explain every permission,
   as in [permissions.md](permissions.md), and describe what is requested from which host, in the listing's
   privacy section. Say plainly that the extension is unofficial and not affiliated with your
   game's publisher, keep the publisher's logos out of your name and icon, and show only
   pictures you have the right to serve. Read the store's current policies yourself: this
   repository has not been through a store review.
