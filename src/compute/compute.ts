// SPDX-License-Identifier: Apache-2.0
// The compute frame: an extension page inside the video page, hidden. It hosts the runtime's
// worker (on the extension's origin, under the extension's policy, which allows WebAssembly)
// and the session that decides when a picture is analyzed (host-session.ts). The wiring and
// its origin rule are in frame.ts.
//
// This frame is made on the first hover over a video whose channel the viewer turned card hovers
// on for (the in-player button), so the release loads then and never at install.

import { RELEASE_PATH, WORKER_PATH } from "../constants.js";
import { allowedParentOrigin } from "../shared/messages.js";
import type { FrameAnalysis } from "../../vendor/cardvision-browser/cardvision.js";
import { startComputeFrame, type WorkerLike } from "./frame.js";
import { DRIVER_TICK_MS } from "./host-session.js";
import { buildLoadRequest } from "./load-request.js";

declare const __DEV__: boolean;

// Dev builds only: per-frame figures for the smoke check.
const frames: Array<Record<string, number | null>> = [];

void (async () => {
  const framed = window.parent !== window;
  const parentOrigin = location.ancestorOrigins?.[0] ?? null;
  if (!framed || parentOrigin === null || !allowedParentOrigin(parentOrigin, __DEV__)) return;
  const workerUrl = chrome.runtime.getURL(WORKER_PATH);
  const frame = startComputeFrame({
    win: window,
    framed,
    parentOrigin,
    dev: __DEV__,
    createWorker: () => new Worker(workerUrl, { type: "module" }) as unknown as WorkerLike,
    loadRequest: buildLoadRequest(chrome.runtime.getURL(RELEASE_PATH), new URL("./", workerUrl).href),
    now: () => performance.now(),
    ...(__DEV__
      ? {
          onAnalysis: (analysis: FrameAnalysis) => {
            const faces = analysis.boxes.filter((b) => b.face);
            frames.push({
              analyzeMs: analysis.timings.analyzeMs,
              detectorMs: analysis.timings.detectorMs,
              recognizeMs: analysis.timings.recognizeMs,
              faces: faces.length,
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
    (window as unknown as { __duelsightDebug: () => unknown }).__duelsightDebug = () => ({
      state: frame.session.state,
      error: frame.session.error,
      backend: frame.session.backend,
      analyzed: frame.session.framesAnalyzed,
      lastFrameError: frame.session.lastFrameError,
      lastWorkerMs: frame.session.lastWorkerMs,
      restarts: frame.restarts,
      stopped: frame.stopped,
      frames,
    });
  }
})();
