<!-- SPDX-License-Identifier: Apache-2.0 -->
# Development

Building the extension from source, updating the vendored runtime, checking it on a local video, and maintainer notes.

*[Back to README](../README.md)*

## Build from source

Node 22 or later.

```
npm ci
npm test
npm run build -- --release <release folder> --images-index <images.jsonl>
```

- `--release` is a release folder of the recognition models as the runtime's
  `cardvision build-release` writes it (`release.json` and the files it pins). The build checks
  it with the runtime's own verification (every file against its SHA-256 and size, the parts
  against each other) and copies it into `dist/release/`. Release files are never committed.
- `--images-index` (optional) is the card picture mirror's index (JSON Lines with `file` and
  `url`), from which the file-name map of the `optcgapi` fallback is built afresh. Without it,
  the build uses the committed copy, `data/source-files.json` (card ids and file names only),
  which `node scripts/source-map.mjs --catalog <catalog.json> --images-index <images.jsonl>`
  regenerates.
- `--dev` makes a development build that also runs on the local test page.

The result is `dist/`, an unpacked extension: load it with **Load unpacked**, as in [Install from a release zip](install-from-zip.md).

- Builds carry the public key in `keys/unpacked-public.pem` as the manifest's `key`, which fixes
  the extension ID of unpacked installs. `--store` leaves it out, for a Chrome Web Store upload
  (the store assigns its own ID). The private key is not in this repository.
- The models' license, notice and provenance (`release-legal/`) are copied beside them into
  `dist/release/`; the build fails without them.

`npm run package` zips a release build into `kenbunshoku-<version>.zip` for a release page.

## The runtime

`vendor/cardvision-browser/` holds the runtime's built modules at the commit recorded in its
`VENDOR.json`, with its license and notice. To update it:

```
node scripts/vendor-runtime.mjs --repo <path to a cardvision toolkit checkout> --commit <sha> \
    --opencv <folder with the runtime's OpenCV.js build>
```

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
npm run build -- --dev --release <release folder> --images-index <images.jsonl>
npm run manual -- --video /path/to/clip.mp4
```

Load `dist/` in Chrome, open the address it prints (`http://127.0.0.1:8770/`), and rest the
pointer on a card.

`test/smoke/smoke.mjs` does the same headlessly in Chrome for Testing and prints the cards it
was shown (see the comment at its top; it needs `puppeteer-core`, which is not a dependency).

## Maintainer notes

- **The card-art CDN** (`cdn.kenbunshoku.com`: card images and the settings file) is published
  from `cdn/` with `cdn/opcdn.py` (plan, publish, verify; credentials from `cdn/.env`, never
  committed). [cdn/README.md](../cdn/README.md) has the setup and the steps;
  [cdn/SETTINGS.md](../cdn/SETTINGS.md) is the settings file's contract, and `cdn/config.json` is
  both the published settings and the extension's built-in default.

- `kenbunshoku.config.json` holds the extension's names, sites, image hosts, settings address,
  printed-number rule, geometric pin and links; `scripts/fork-config.mjs` explains and checks it.
- A new image host needs an extension release: the settings file can only name hosts in the
  config's `imageHosts`, which become the manifest's host permissions and the extension pages'
  `connect-src`.
- The settings file's `update.url` must lie under the config's `updateUrlPrefix`.
- TODO (each new set): when a release adds a set, update the set line in the "New sets" bullet of
  the Limits list in [accuracy.md](accuracy.md) (today OP-17, EB-04, ST-36, PRB-02).
- TODO (unpublished addresses): the cardvision toolkit's repository, its adapt guide and the
  runtime's source are not public yet. When they are, link them from "Built on cardvision" in the README, the
  steps in [make-it-yours.md](make-it-yours.md), "The runtime" above and `NOTICE` (the cardvision-browser upstream). The
  models' `release-legal/` already points at the README's "Built on cardvision", so it needs no change.
