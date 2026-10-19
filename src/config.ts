// SPDX-License-Identifier: Apache-2.0
// kenbunshoku.config.json, as the extension's code reads it. The build checks the file
// (scripts/fork-config.mjs) and bundles it, so these values are fixed in each build. Every value
// a fork changes comes from here; src/constants.ts names them for the rest of the code.

import RAW from "../kenbunshoku.config.json";

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
  imageHosts: string[];
  settingsUrl: string | null;
  /** The hovered card's outline: its solid edge's color and its glow's color (CSS colors);
   *  optional, a card-back navy edge and a brighter blue glow by default. */
  outlineColor?: string;
  outlineGlowColor?: string;
  printedNumber: PrintedNumberRule;
  geometric: { settings: string; manifestSha256: string } | null;
  updateUrlPrefix: string | null;
  projectUrl: string;
  modelUrl: string | null;
  runtimeUrl: string;
  maintainerContactUrl: string | null;
  packageName: string;
}

export const CONFIG = RAW as unknown as ForkConfig;
