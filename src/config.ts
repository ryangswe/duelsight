// SPDX-License-Identifier: Apache-2.0
// duelsight.config.json, as the extension's code reads it. The build checks the file
// (scripts/fork-config.mjs) and bundles it, so these values are fixed in each build. Every value
// a fork changes comes from here; src/constants.ts names them for the rest of the code.

import RAW from "../duelsight.config.json";

export type PrintedNumberRule = { regex: string } | "catalog" | "none";

export interface VideoSites {
  youtube: boolean;
  twitch: boolean;
}

export interface ForkConfig {
  name: string;
  shortName: string;
  description: string;
  icons: string;
  videoSites: VideoSites;
  /** The CDN and settings origin, written once; `imageHosts` and `settingsUrl` follow from it (the build derives them). */
  cdnBase?: string | null;
  imageHosts: string[];
  settingsUrl: string | null;
  /** The hovered card's outline: its solid edge's color and its glow's color (CSS colors);
   *  optional, a navy edge and a blue glow by default. */
  outlineColor?: string;
  outlineGlowColor?: string;
  printedNumber: PrintedNumberRule;
  updateUrlPrefix: string | null;
  projectUrl: string;
  modelUrl: string | null;
  runtimeUrl: string;
  maintainerContactUrl: string | null;
  packageName: string;
}

/**
 * The config as the build checked it. With a `cdnBase`, `imageHosts` and `settingsUrl` follow
 * from it (scripts/fork-config.mjs `withCdnBase` gives the same values): the bundles already
 * carry them, and the tests, which read the file directly, get them here.
 */
const raw = RAW as unknown as ForkConfig;
export const CONFIG: ForkConfig = raw.cdnBase
  ? { ...raw, imageHosts: [new URL(raw.cdnBase).hostname], settingsUrl: `${raw.cdnBase}/config.json` }
  : raw;
