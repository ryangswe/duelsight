// SPDX-License-Identifier: Apache-2.0
// The request that starts the runtime's worker on the release bundled in the extension. It is the
// runtime's plain `load`: this build has no extra-accuracy stage, so the request carries no
// feature index and nothing to download beyond the release.

import type { WorkerRequest } from "../../vendor/cardvision-browser/cardvision.js";

export type LoadRequest = Extract<WorkerRequest, { kind: "load" }>;

export function buildLoadRequest(releaseUrl: string, wasmPaths: string): LoadRequest {
  return { kind: "load", releaseUrl, wasmPaths };
}
