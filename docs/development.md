<!-- SPDX-License-Identifier: Apache-2.0 -->
# Development

Building the extension from source, updating the vendored runtime, checking it on a local video, and maintainer notes.

*[Back to README](../README.md)*

## Build from source

Node 22 or later.

```
npm ci
npm test
npm run build -- --release <release folder>
```

- `--release` is a release folder of the recognition models as the runtime's
  `cardvision build-release` writes it (`release.json` and the files it pins). The build checks
  it with the runtime's own verification (every file against its SHA-256 and size, the parts
  against each other) and copies it into `dist/release/`. Release files are never committed.
- `--dev` makes a development build that also runs on the local test page.
- Until the DuelSight release exists, `release-legal/` is a placeholder for the cardvision toolkit's
  20-card toy release (a dev fixture; its id is on the first line of `release-legal/NOTICE`).
  Build against that toy release to try the build and the tests' manual page; a package made from
  it is not a DuelSight release. No other game's data or art is in this repository.

The result is `dist/`, an unpacked extension: load it with **Load unpacked**, as in [Install from a release zip](install-from-zip.md).

- Builds carry the public key in `keys/unpacked-public.pem` as the manifest's `key`, which fixes
  the extension ID of unpacked installs. `--store` leaves it out, for a Chrome Web Store upload
  (the store assigns its own ID). The private key is not in this repository.
- The models' license, notice and provenance (`release-legal/`) are copied beside them into
  `dist/release/`; the build fails without them.

`npm run package` zips a release build. A build with the key becomes `duelsight-<version>.zip` for a
release page, with every file inside one `duelsight-<version>/` folder (the folder a user selects in
"Load unpacked"). A `--store` build becomes `duelsight-<version>-store.zip` with `manifest.json` at the
zip's top level, as the Chrome Web Store requires. It refuses a dev build, and a build that holds
OpenCV.js, geometric-stage files (this build ships none) or a card details file.

## Firefox

The same sources build for Firefox (desktop; 148 or later):

```
npm run build -- --target firefox --release <release folder>        # the addons.mozilla.org build
npm run build -- --target firefox --dev --release <release folder>  # dev: also the local test page
npm run package                                                    # duelsight-<version>-firefox.zip
```

Only the manifest differs (`firefoxManifest` in `scripts/manifest.mjs`):

- the background module runs as a background script (Firefox has no service worker);
- no `key` and no `minimum_chrome_version`;
- a `gecko` block with the add-on ID (`firefoxAddonId` in `duelsight.config.json`, permanent once
  listed; a dev build uses `duelsight-dev@duelsight.com`, so it loads beside the listed add-on),
  the minimum Firefox version and the data declaration (`required: ["none"]`: nothing about the
  user leaves the browser).

The minimum is 148, the first Firefox with `location.ancestorOrigins`: the compute and tooltip
frames read it to know the page they are in, and do not start without it. Permissions are the
Chrome manifest's. The popup never shows the "New version available" line in Firefox, which
installs only signed add-ons and updates them itself (`__TARGET__`, set by the build, is
`"chrome"` or `"firefox"`; compare it at the use site).

Code that runs in Firefox uses only `chrome.storage` and `chrome.runtime`. Before using another
`chrome.*` API, check MDN's compatibility table for Firefox 148. The background is an event page:
it may stop when idle, so it keeps no state outside storage.

To try a build: `about:debugging` → This Firefox → Load Temporary Add-on → `dist/manifest.json`.
Before an upload: unzip the package and run `npx web-ext lint --source-dir <folder>` (0 errors),
then `node scripts/firefox-source-archive.mjs --release <folder> --runtime-repo <toolkit checkout>`
for the source archive Mozilla's reviewers rebuild from (the bundles are minified). Unzip the
archive into an empty folder, run `./build-firefox.sh`, and `diff -r` the unzipped
`out/duelsight-<version>-firefox.zip` against the unzipped upload: every file must match.

## The runtime

`vendor/cardvision-browser/` holds the runtime's built modules at the commit recorded in its
`VENDOR.json`, with its license and notice. To update it:

```
node scripts/vendor-runtime.mjs --repo <path to a cardvision toolkit checkout> --commit <sha> \
    --opencv <folder with the runtime's OpenCV.js build>
```

The runtime's own build still wants OpenCV.js, so the vendor step does too; DuelSight's build never
copies it into the extension (see "The runtime" in [how-it-works.md](how-it-works.md)). Dropping it
from the vendored folder is a change for the toolkit's build, not for this repository.

It builds the runtime from that commit in a temporary folder (its own `npm ci` and `npm run
build`) and copies the result here. OpenCV.js (`opencv.mjs`, `opencv_js.wasm`, their
`opencv.mjs.LEGAL.txt`) is built by the runtime's `scripts/build-opencv.mjs`, which git does not
keep; `--opencv` names that build, which must match the commit's `opencv.lock.json` (recorded in
`VENDOR.json`). ONNX Runtime Web's WebAssembly files are not vendored; the
build copies them from this repository's `onnxruntime-web` dependency, which must be the version
`VENDOR.json` names.

## Manual check on a local video

A dev build runs on a local test page that plays a video file you name. No footage is kept in
this repository.

```
npm run build -- --dev --release <release folder>
npm run manual -- --video /path/to/clip.mp4
```

Load `dist/` in Chrome, open the address it prints (`http://127.0.0.1:8770/`), and rest the
pointer on a card.

`test/smoke/smoke.mjs` does the same headlessly in Chrome for Testing and prints the cards it
was shown (see the comment at its top; it needs `puppeteer-core`, which is not a dependency).

## Maintainer notes

- **The card-art CDN** (card images and the settings file) is published from `cdn/` with
  `cdn/dscdn.py` (plan, publish, verify; credentials from `cdn/.env`, never committed), by the
  owner. [cdn/README.md](../cdn/README.md) has the setup and the steps;
  [cdn/SETTINGS.md](../cdn/SETTINGS.md) is the settings file's contract, and `cdn/config.json` is
  both the published settings and the extension's built-in default.
- `duelsight.config.json` holds the extension's names, sites, CDN base, printed-number rule and
  links; `scripts/fork-config.mjs` explains and checks it. `cdnBase` is the one place the CDN host is
  written. The places that follow it: the manifest's host permissions and the pages' `connect-src`
  (derived), `settingsUrl` (derived), `cdn/config.json`'s `primary` template, `cdn/SETTINGS.md`,
  `cdn/README.md`, `PRIVACY.md`, `docs/permissions.md` and the tests' fixture host. The tests fail
  when the derived values and the config disagree; the prose files are updated by hand.
- A new image host needs an extension release: the settings file can name the config's host
  alone, which becomes the manifest's host permission and the extension pages' `connect-src`.
- The settings file's `update.url` must lie under the config's `updateUrlPrefix`.
- Card ids are YGOPRODeck passcodes (digits, up to 8): the `printedNumber` rule in the config.
- The routine for new cards, a model refresh and a handoff is in [MAINTAINING.md](../MAINTAINING.md).
