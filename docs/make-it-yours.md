<!-- SPDX-License-Identifier: Apache-2.0 -->
# Make it yours: an extension for another card game

*[Back to README](../README.md)*

DuelSight is Apache-2.0, and began as a copy of Kenbunshoku (the One Piece extension). Its
recognition is not specific to one game: the models, the bank and the card list all come from the
release folder. What makes this build DuelSight (its names, sites, CDN host, addresses and the
rule for card numbers) is in one file, `duelsight.config.json`. The build checks it and refuses a file with a problem, saying which.
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
   `duelsight.config.json`, so they stay green as you change it. Tests of DuelSight's own
   values (its ID, its CDN) are skipped in a copy whose `packageName` is not
   `duelsight`. One test fails until you change both the `packageName` (step 2) and the
   extension's key (step 6): a copy must not keep one of DuelSight's and not the other.
   Every run of `npm test` also prints `DOMException` lines and stack traces before its
   summary ("Failed to load iframe page ... Iframe page loading is disabled.", from the
   happy-dom test environment): they are harmless when the summary says every test passed.

2. **Edit `duelsight.config.json`.** Its keys are explained at the top of
   `scripts/fork-config.mjs`. In short:
   - `name`, `shortName`, `description`: your extension's names (manifest, popup, store);
     `packageName`: the release zip's name.
   - `icons`: a folder holding `icon-16.png`, `icon-32.png`, `icon-48.png` and `icon-128.png`
     (`node scripts/icons.mjs` redraws DuelSight's placeholder).
   - `videoSites`: `{ "youtube": true|false, "twitch": true|false }`. The manifest's sites
     and the pages the extension's frames accept follow it.
   - `cdnBase`: the CDN and settings origin, written once (`https://host`, no path). The
     build derives `imageHosts` (that host, which becomes the extension's host permission and the
     one host its pages may connect to) and `settingsUrl` (`<cdnBase>/config.json`) from it; do
     not write them beside it. Without a `cdnBase`, write `imageHosts` (`[]` for none) and
     `settingsUrl` (an address on one of them, or `null`: the extension then fetches nothing and
     uses the copy built into it, step 4) yourself.
   - `printedNumber`: how the number printed on a card is found, available to image addresses
     as `{printedId}`: `{ "regex": "…" }` (its first capture group,
     matched on the card id), `"catalog"` (an optional `printed` field on each card in your
     catalog), or `"none"`. DuelSight's ids are passcodes, so its rule is `^(\\d{1,8})$`.
   - `outlineColor` and `outlineGlowColor` (optional): the hovered card's outline, a solid edge
     and the glow fading out around it, as CSS colors (defaults `"#1b2f6b"` navy, `"rgba(61, 111, 224, 0.6)"` blue).
   - `projectUrl` and `runtimeUrl`: the popup's two links (keep `runtimeUrl`: it credits the
     runtime). `updateUrlPrefix`: where a "New version available" line may link, or `null`
     for never. `modelUrl`, `maintainerContactUrl`: yours, or `null`.

3. **Your models.** Pass your release folder to the build with `--release`. Rewrite
   `release-legal/` for your models: `LICENSE` (your models' license), `NOTICE`, whose first
   line must contain `(id <your release id>)` (the build refuses any other release), and
   `PROVENANCE.md` (what the models were trained and built from). Release files are never
   committed. The card's name (the picture's alt text, and what shows without a picture)
   comes from the release's catalog. This build reads names from the release's catalog only: it has no third-party card source and
   no `{sourceFile}` map.

4. **Card pictures: choose one.** `cdn/config.json` is the settings file built into the
   extension, used when no fetch has succeeded (always, with `settingsUrl` `null`).
   - **Names only.** Set `"namesOnly": true`, `"primary": null`, `"fallbacks": []`,
     The tooltip then shows each card's name.
   - `cardLink` and `geometric` are retired fields: leave them out of the file; the extension
     ignores them ([cdn/SETTINGS.md](../cdn/SETTINGS.md)).
   - **Your own image host.** Follow [cdn/SETTINGS.md](../cdn/SETTINGS.md), the settings file's
     contract. Serve each picture at a path made from the catalog's `art` value (for example
     `https://<your host>/art/{art}`), serve `config.json` beside it with
     `Access-Control-Allow-Origin: *`, set `primary` to that template. Put the host in
     `cdnBase`. `cdn/dscdn.py` publishes to Cloudflare R2 ([cdn/README.md](../cdn/README.md)); read its
     guards before you reuse it, since they name other projects. Any static host that serves
     the same files works too.

5. **No extra-accuracy stage.** This build has none: no `geometric` key, no settings file, no
   OpenCV.js in the package (`npm run package` refuses one), no unlimited-storage permission. The
   vendored runtime's own code still holds the stage, dormant. A fork that wants it back takes
   it from Kenbunshoku, which keeps it (its `geometric` config key, `data/geometric.json` and
   the CDN index).

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

7. **Delete the text of the game you copied** that no longer applies: the README and the pages in
   `docs/` (accuracy figures are for one game's models only: measure your own), `PRIVACY.md`
   (rewrite it for your host), and `cdn/README.md` if you do not use `cdn/dscdn.py`. Delete the
   install screenshots (they show the extension you copied). Rename the package in
   `package.json` and `package-lock.json`. Keep `LICENSE` and
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
