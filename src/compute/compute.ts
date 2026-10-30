// SPDX-License-Identifier: Apache-2.0
// The compute frame: an extension page inside the video page, hidden. It hosts the runtime's
// worker (on the extension's origin, under the extension's policy, which allows WebAssembly) and
// the toolkit's session, which decides when a picture is analyzed and what is shown at the
// pointer. DuelSight's options and its card facts channel are in frame.ts.
//
// This frame is made on the first pointer move over a video's picture, so the release loads then
// and never at install. Which release: the bundled one, or the one the settings file names (the
// vendored remote-release module, cdn/SETTINGS.md "release"), read once per page.

import { CONFIG } from "../config.js";
import { RELEASE_PATH, SETTINGS_URL, WORKER_PATH } from "../constants.js";
import { readEffectiveSettings } from "../settings/store.js";
import { FACTS_CHANNEL, parseFactsRequest } from "../shared/messages.js";
import { buildCardTable, chooseRelease, decisionLine, recordSkip, type ReleaseDecision } from "../../vendor/cardvision-browser/remote-release.js";
import type { FrameAnalysis } from "../../vendor/cardvision-browser/cardvision.js";
import { DRIVER_TICK_MS, type WorkerLike } from "../../vendor/cardvision-browser/compute-session.js";
import { startDuelSightFrame } from "./frame.js";
import { buildLoadRequest } from "./load-request.js";

declare const __DEV__: boolean;

// Dev builds only: per-frame figures for the smoke check.
const frames: Array<Record<string, number | null>> = [];

const sha256Hex = async (bytes: ArrayBuffer): Promise<string> => {
  const digest = await crypto.subtle.digest("SHA-256", bytes);
  return Array.from(new Uint8Array(digest), (b) => b.toString(16).padStart(2, "0")).join("");
};

void (async () => {
  const framed = window.parent !== window;
  const parentOrigin = location.ancestorOrigins?.[0] ?? null;
  const workerUrl = chrome.runtime.getURL(WORKER_PATH);
  const loadRequest = buildLoadRequest(chrome.runtime.getURL(RELEASE_PATH), new URL("./", workerUrl).href);
  const facts = new BroadcastChannel(FACTS_CHANNEL);
  // The bundled release's id, for the log line (a file inside the extension: nothing is fetched).
  const bundledId = await fetch(chrome.runtime.getURL(RELEASE_PATH))
    .then((r) => r.json() as Promise<{ id?: string }>)
    .then((doc) => doc.id ?? "-")
    .catch(() => "-");
  let lastDecision: ReleaseDecision | null = null;
  const settingsUrl = SETTINGS_URL;
  const started = startDuelSightFrame({
    win: window,
    framed,
    parentOrigin,
    dev: __DEV__,
    createWorker: () => new Worker(workerUrl, { type: "module" }) as unknown as WorkerLike,
    loadRequest,
    now: () => performance.now(),
    // A build with no settings address never fetches anything: the bundled release only.
    ...(settingsUrl !== null
      ? {
          chooseRelease: (hooks: { onDownloading(): void }) =>
            chooseRelease(
              {
                storage: chrome.storage.local,
                readReleaseField: async () => (await readEffectiveSettings(chrome.storage.local)).settings.release ?? null,
                running: chrome.runtime.getManifest().version,
                now: () => performance.now(),
                bundled: loadRequest,
                buildCardTable: (catalog) => buildCardTable(catalog, { printed: CONFIG.printedNumber === "catalog" }),
                fetch: (...args) => fetch(...args),
                sha256Hex,
                settingsUrl,
                extensionUrl: (path) => chrome.runtime.getURL(path),
              },
              hooks,
            ),
          recordSkip: (pointer, reason) => void recordSkip(chrome.storage.local, pointer, reason).catch(() => undefined),
        }
      : {}),
    onDecision: (d) => {
      lastDecision = d;
      // Local only, never sent: no page, channel, video, frame or card.
      console.info(decisionLine(CONFIG.name, d, bundledId));
    },
    postFacts: (message) => facts.postMessage(message),
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
  if (!started) return;
  const { frame } = started;
  // A tooltip frame that lacks a card's facts asks for them on the channel (one made again, or a
  // card that arrived before its facts); the frame whose release it is answers.
  facts.onmessage = (event: MessageEvent) => {
    const want = parseFactsRequest(event.data);
    const answer = want ? started.facts.factsFor(want.releaseId, want.cardId) : null;
    if (answer) facts.postMessage(answer);
  };
  // Nothing in the session runs on its own: the driver tick runs its cadence, repeats and watchdog.
  const ticker = setInterval(() => frame.tick(), DRIVER_TICK_MS);
  addEventListener("pagehide", () => {
    clearInterval(ticker);
    frame.stop();
    facts.close();
  });
  if (__DEV__) {
    // Dev builds only: what the smoke check reads (test/smoke/smoke.mjs).
    (window as unknown as { __duelsightDebug: () => unknown }).__duelsightDebug = () => {
      const status = frame.core?.status() ?? null;
      return {
        state: status?.state ?? "loading",
        error: status?.error ?? null,
        backend: status?.backend ?? null,
        analyzed: status?.frames ?? 0,
        lastFrameError: status?.lastFrameError ?? null,
        lastWorkerMs: status?.lastWorkerMs ?? null,
        restarts: frame.restarts,
        stopped: frame.stopped,
        release: { source: frame.release.source, id: frame.release.id, reason: frame.release.reason, decision: lastDecision },
        frames,
      };
    };
  }
})();
