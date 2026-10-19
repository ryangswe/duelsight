// SPDX-License-Identifier: Apache-2.0
// The request that starts the runtime's worker on the release bundled in the extension, with
// the geometric stage when it is on: `geometricUrl` (the stage's settings file, bundled) and
// `geometricManifestSha256` (the pinned manifest of the card-feature index), always together.
// Without them the request is the runtime's plain `load`, and the stage does not run.

import type { WorkerRequest } from "../../vendor/cardvision-browser/cardvision.js";
import { GEOMETRIC_MANIFEST_SHA256, GEOMETRIC_SETTINGS_PATH } from "../constants.js";

export type LoadRequest = Extract<WorkerRequest, { kind: "load" }>;

export interface GeometricOption {
  /** Address of the stage's settings file. */
  url: string;
  /** SHA-256 of the packed index's manifest.json. */
  manifestSha256: string;
}

/** The stage for these settings: on when the build has it (kenbunshoku.config.json) and the
 *  settings file does not say `geometric: false`; then the bundled settings file and the pinned
 *  manifest. `url` resolves a path inside the extension. */
export function geometricOption(
  settings: { geometric: boolean },
  url: (path: string) => string,
  pin: string | null = GEOMETRIC_MANIFEST_SHA256,
): GeometricOption | null {
  return settings.geometric && pin !== null ? { url: url(GEOMETRIC_SETTINGS_PATH), manifestSha256: pin } : null;
}

export interface StageDecision {
  option: GeometricOption | null;
  /** Why the stage is off for this page, or null when it is on. */
  offReason: "settings" | "settings-unreadable" | null;
}

/** Decide the stage for a page from the effective settings. A settings read that fails turns
 *  the stage off for the page and never stops the base pipeline. */
export async function stageForPage(read: () => Promise<{ geometric: boolean }>, url: (path: string) => string): Promise<StageDecision> {
  try {
    const option = geometricOption(await read(), url);
    return { option, offReason: option ? null : "settings" };
  } catch {
    return { option: null, offReason: "settings-unreadable" };
  }
}

export function buildLoadRequest(releaseUrl: string, wasmPaths: string, geometric: GeometricOption | null): LoadRequest {
  return {
    kind: "load",
    releaseUrl,
    wasmPaths,
    ...(geometric ? { geometricUrl: geometric.url, geometricManifestSha256: geometric.manifestSha256 } : {}),
  };
}
