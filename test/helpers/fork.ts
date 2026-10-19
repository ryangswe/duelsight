// SPDX-License-Identifier: Apache-2.0
// What the tests need to know about the build they test: they read duelsight.config.json, so
// a fork that edits it keeps a green suite. Tests of DuelSight's own data (its extension ID, its
// CDN contract) run only for DuelSight's config.

import { CONFIG } from "../../src/config.js";

export { CONFIG };

/** DuelSight's own build, as opposed to a fork of it. */
export const IS_DUELSIGHT = CONFIG.packageName === "duelsight";

/** The origin of a video site this build runs on (for tests that need one). */
export const SITE_ORIGIN = CONFIG.videoSites.youtube ? "https://www.youtube.com" : "https://www.twitch.tv";

/** The CDN origin the fixtures use: the placeholder, an address that never resolves. */
export const FIXTURE_CDN = "https://cdn.duelsight.com";

/** A passcode-shaped printed-number rule (tests of the rule engine): the whole id, up to 8 digits. */
export const PASSCODE_RULE = { regex: String.raw`^(\d{1,8})$` } as const;

/** A minimal config: names only, no settings address, one site. */
export const TOY_CONFIG = {
  name: "Toy Cards",
  shortName: "Toy Cards",
  description: "Hover a toy card in a YouTube video to see which card it is.",
  icons: "icons",
  videoSites: { youtube: true, twitch: false },
  imageHosts: [] as string[],
  settingsUrl: null,
  printedNumber: "none" as const,
  updateUrlPrefix: null,
  projectUrl: "https://example.org/toy-cards",
  modelUrl: null,
  runtimeUrl: "https://example.org/toy-cards#built-on",
  maintainerContactUrl: null,
  packageName: "toy-cards",
};
