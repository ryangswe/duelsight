// SPDX-License-Identifier: Apache-2.0
// DuelSight for the toolkit's shared hover browser test (vendor/cardvision-browser/harness/
// hover-browser.mjs, --product). The harness loads the unpacked dev build in headless Chrome for
// Testing, plays a clip it renders from the card pictures below on a local page, serves the
// settings host from a local stand-in, and fails when a hover behavior breaks. CI runs it in the
// "Hover browser test" job of .github/workflows/tests.yml; test/browser/LIVE-CHECKS.md maps its
// checks to the steps done by hand. The fields are described in the toolkit's
// harness/example/product.mjs.

export default {
  name: "DuelSight",
  /** The product's config file, and the settings address in it (the stand-in serves that host). */
  config: new URL("../../duelsight.config.json", import.meta.url),
  settingsUrl: (config) => `${config.cdnBase}/config.json`,
  /** The repository's root (--art must be outside it), and the dev build a run loads by default. */
  root: new URL("../../", import.meta.url),
  dist: new URL("../../dist", import.meta.url),
  /** The dev builds' debug global in the compute frame (src/compute/compute.ts). */
  debugGlobal: "__duelsightDebug",
  /** The outline's wrapper in the page. */
  outlineSelector: '[data-duelsight="outline"]',
  /** The extension's two frames, and the tooltip frame's picture, picture box and name pill. */
  frames: { compute: "compute.html", tooltip: "tooltip.html" },
  /** An extension page that starts the background worker again when Chrome has stopped it. The
   *  popup does so because it sends the background a settings:refresh message as it opens. */
  wakePage: "popup.html",
  tooltipIds: { img: "img", art: "art", pill: "pill" },
  /** The settings file the stand-in serves, in the product's schema: no release pointer (the
   *  bundled release only), only the given picture address, no update notice and no card details
   *  file (the tooltip shows the picture without its details panel). DuelSight's releases have no
   *  geometric stage, so there is none to turn off. */
  testSettings: (artTemplate) => ({
    schemaVersion: 1,
    updatedAt: "2026-11-13T00:00:00Z",
    namesOnly: false,
    primary: { id: "cdn", template: artTemplate },
    fallbacks: [],
  }),
  /** Where the settings file puts card pictures, relative to the settings host. */
  artPath: (art) => `/art/${art}`,
  /** The storage keys of the popup's switches. */
  keys: { enabled: "enabled", keepCard: "keepCard" },
  /** The cards of the clip: catalog ids, each with its picture file named in the release catalog. */
  cards: { A: "89631139", B: "55144522", C: "44095762", D: "46986420" },
  /** Card width in the 1280x720 clip, in pixels, and the card's height over its width (59x86 mm). */
  cardWidth: 158,
  cardAspect: 86 / 59,
  /** The clip: 20 s at 15 frames a second, looping. A is on show for the whole clip, and D is laid
   *  on top of it from 8 s (a card covering the hovered one). B is on show for the whole clip. C is
   *  on show until 12 s, then picked up, and laid back in its place at 16 s (a card that arrives
   *  under a resting pointer, with no seek). */
  clip: { width: 1280, height: 720, fps: 15, seconds: 20 },
  places: {
    A: { x: 140, y: 250 },
    B: { x: 430, y: 250 },
    C: { x: 720, y: 250, until: 12, back: 16 },
    D: { x: 152, y: 262, from: 8 },
  },
  /** Checks expected to fail on this product's code, each until the change named fixes it. */
  expectedFail: {},
};
