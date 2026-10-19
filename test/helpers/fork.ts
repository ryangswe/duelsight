// SPDX-License-Identifier: Apache-2.0
// What the tests need to know about the build they test: they read kenbunshoku.config.json, so
// a fork that edits it keeps a green suite. Tests of Kenbunshoku's own data (its release notes,
// its CDN contract) run only for Kenbunshoku's config.

import { CONFIG } from "../../src/config.js";

export { CONFIG };

/** Kenbunshoku's own build, as opposed to a fork. */
export const IS_KENBUNSHOKU = CONFIG.packageName === "kenbunshoku";

/** The origin of a video site this build runs on (for tests that need one). */
export const SITE_ORIGIN = CONFIG.videoSites.youtube ? "https://www.youtube.com" : "https://www.twitch.tv";

/** One Piece's printed-number rule, as Kenbunshoku's config states it (tests of the rule engine). */
export const ONE_PIECE_RULE = {
  regex: String.raw`^(?:[^_]*_)*?([A-Z]{1,4}\d{0,2}-\d{2,3}[A-Z]?)(?:_.*)?(?:-(?:r|pr)\d+)?(?:-JP)?$`,
} as const;

/** A minimal config: names only, no settings address, no geometric stage, one site. */
export const TOY_CONFIG = {
  name: "Toy Cards",
  shortName: "Toy Cards",
  description: "Hover a toy card in a YouTube video to see which card it is.",
  icons: "icons",
  videoSites: { youtube: true, twitch: false },
  imageHosts: [] as string[],
  settingsUrl: null,
  printedNumber: "none" as const,
  geometric: null,
  updateUrlPrefix: null,
  projectUrl: "https://example.org/toy-cards",
  modelUrl: null,
  runtimeUrl: "https://example.org/toy-cards#built-on",
  maintainerContactUrl: null,
  packageName: "toy-cards",
};
