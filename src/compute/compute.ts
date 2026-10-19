// SPDX-License-Identifier: Apache-2.0
// The compute frame: an extension page inside the video page, hidden. It hosts the runtime's
// worker (on the extension's origin, under the extension's policy, which allows WebAssembly)
// and the session that decides when a picture is analyzed (host-session.ts). The wiring and
// its origin rule are in frame.ts.
//
// This frame is made on the first hover over a video whose channel the viewer turned card hovers
// on for (the in-player button), so the release, and after it the
// geometric stage's card-feature index (about 60 MB, from the image host, kept in the
// browser's cache), load then and never at install.

import { RELEASE_PATH, WORKER_PATH } from "../constants.js";
import { readEffectiveSettings } from "../settings/store.js";
import { allowedParentOrigin } from "../shared/messages.js";
import type { FrameAnalysis } from "../../vendor/cardvision-browser/cardvision.js";
import { startComputeFrame, type WorkerLike } from "./frame.js";
import { DRIVER_TICK_MS } from "./host-session.js";
import { buildLoadRequest, stageForPage } from "./load-request.js";

declare const __DEV__: boolean;

// Dev builds only: per-frame figures for the smoke check.
const frames: Array<Record<string, number | null>> = [];
let geometricBytes: number | null = null;

void (async () => {
  const framed = window.parent !== window;
  const parentOrigin = location.ancestorOrigins?.[0] ?? null;
  if (!framed || parentOrigin === null || !allowedParentOrigin(parentOrigin, __DEV__)) return;
  // The settings file can switch the stage off without a release (`geometric: false`).
  const decision = await stageForPage(
    async () => (await readEffectiveSettings(chrome.storage.local)).settings,
    (path) => chrome.runtime.getURL(path),
  );
  const geometric = decision.option;
  if (geometric) {
    // Ask the browser to keep the index's cache under storage pressure. Only a page can ask
    // (not the worker that fills the cache), so this frame does.
    void navigator.storage?.persist?.().catch(() => false);
  }
  const workerUrl = chrome.runtime.getURL(WORKER_PATH);
  const frame = startComputeFrame({
    win: window,
    framed,
    parentOrigin,
    dev: __DEV__,
    createWorker: () => new Worker(workerUrl, { type: "module" }) as unknown as WorkerLike,
    loadRequest: buildLoadRequest(chrome.runtime.getURL(RELEASE_PATH), new URL("./", workerUrl).href, geometric),
    now: () => performance.now(),
    onGeometricStatus: (status) => {
      if (__DEV__) geometricBytes = status.bytes;
    },
    ...(__DEV__
      ? {
          onAnalysis: (analysis: FrameAnalysis) => {
            const faces = analysis.boxes.filter((b) => b.face);
            frames.push({
              analyzeMs: analysis.timings.analyzeMs,
              detectorMs: analysis.timings.detectorMs,
              recognizeMs: analysis.timings.recognizeMs,
              geometricMs: analysis.timings.geometricMs ?? null,
              faces: faces.length,
              verified: faces.filter((b) => b.face?.geometric).length,
              changed: faces.filter((b) => b.face?.geometric && b.face.geometric.before.topId !== b.face.topId).length,
            });
            if (frames.length > 200) frames.shift();
          },
        }
      : {}),
  });
  if (!frame) return;
  setInterval(() => frame.tick(), DRIVER_TICK_MS);
  if (__DEV__) {
    // Dev builds only: what the smoke check reads (test/smoke/smoke.mjs).
    (window as unknown as { __kenbunshokuDebug: () => unknown }).__kenbunshokuDebug = () => ({
      state: frame.session.state,
      error: frame.session.error,
      backend: frame.session.backend,
      analyzed: frame.session.framesAnalyzed,
      lastFrameError: frame.session.lastFrameError,
      lastWorkerMs: frame.session.lastWorkerMs,
      restarts: frame.restarts,
      stopped: frame.stopped,
      geometric: frame.session.geometric,
      geometricBytes,
      frames,
    });
  }
})();
