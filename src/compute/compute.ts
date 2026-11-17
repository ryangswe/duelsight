// SPDX-License-Identifier: Apache-2.0
// The compute frame: an extension page inside the video page, hidden. It hosts the runtime's
// worker (on the extension's origin, under the extension's policy, which allows WebAssembly) and
// the toolkit's session, which decides when a picture is analyzed and what is shown at the
// pointer. DuelSight's card facts channel is in frame.ts.
//
// This frame is made when the page's main video starts playing (or on the first pointer move over
// its picture, for a video that never plays), so the release loads then and never at install.
// Which release: the bundled one, or the one the settings file names (the vendored remote-release
// module, cdn/SETTINGS.md "release"), read once per page. After ten minutes with no pointer over the picture and no card shown, its worker ends and the content
// script removes it; a move over the picture makes it again. The toolkit's shared hover host
// (host-compute.js) checks the page's origin and starts the session with the standard options;
// DuelSight gives it the release to load, its release choice and its card facts channel (frame.ts).

import { CONFIG } from "../config.js";
import { RELEASE_PATH, SETTINGS_URL, WORKER_PATH } from "../constants.js";
import { SETTINGS_SCHEMA } from "../settings/store.js";
import { FACTS_CHANNEL, parseFactsRequest } from "../shared/messages.js";
import { productConfig } from "../shared/product.js";
import { buildCardTable, chooseRelease, decisionLine, recordSkip, type ReleaseDecision } from "../../vendor/cardvision-browser/remote-release.js";
import type { FrameAnalysis } from "../../vendor/cardvision-browser/cardvision.js";
import { createSettingsCore, startHostCompute, type WorkerLike } from "../../vendor/cardvision-browser/host-compute.js";
import { createFactsChannel } from "./frame.js";
import { buildLoadRequest } from "./load-request.js";
import { createPrefetcher } from "./prefetch.js";
import type { CardRef } from "../settings/templates.js";
import type { CardTable } from "../tooltip/card-data.js";

declare const __DEV__: boolean;
// Null except in a dev build made with --idle-unload-ms.
declare const __IDLE_UNLOAD_MS__: number | null;

// Dev builds only: per-frame figures for the smoke check.
const frames: Array<Record<string, number | null>> = [];

// Dev builds only: when this page finished loading, and when the first message from the video page
// arrived (the content script's hello), in epoch ms. The hover browser test reports the difference.
let loadedAt: number | null = null;
let helloAt: number | null = null;
if (__DEV__) {
  const epochNow = (): number => performance.timeOrigin + performance.now();
  addEventListener("load", () => (loadedAt ??= epochNow()));
  addEventListener(
    "message",
    (event) => {
      if (helloAt === null && event.source === window.parent) helloAt = epochNow();
    },
    true,
  );
}

const sha256Hex = async (bytes: ArrayBuffer): Promise<string> => {
  const digest = await crypto.subtle.digest("SHA-256", bytes);
  return Array.from(new Uint8Array(digest), (b) => b.toString(16).padStart(2, "0")).join("");
};

void (async () => {
  const workerUrl = chrome.runtime.getURL(WORKER_PATH);
  const loadRequest = buildLoadRequest(chrome.runtime.getURL(RELEASE_PATH), new URL("./", workerUrl).href);
  // The bundled release's id, for the log line (a file inside the extension: nothing is fetched),
  // read before the session starts.
  const bundledId = await fetch(chrome.runtime.getURL(RELEASE_PATH))
    .then((r) => r.json() as Promise<{ id?: string }>)
    .then((doc) => doc.id ?? "-")
    .catch(() => "-");
  const facts = new BroadcastChannel(FACTS_CHANNEL);
  const channel = createFactsChannel((message) => facts.postMessage(message));
  let lastDecision: ReleaseDecision | null = null;
  const settingsUrl = SETTINGS_URL;

  // Card pictures fetched ahead of the pointer (prefetch.ts), from the card table of the release
  // in effect: the remote release's, once confirmed, else the bundled one (an extension file,
  // read when first needed).
  let releaseTable: () => CardTable | null = () => null;
  let bundledTable: Promise<CardTable> | null = null;
  const prefetcher = createPrefetcher({
    settings: async () => (await createSettingsCore(SETTINGS_SCHEMA, chrome.storage.local).read()).settings,
    card: async (id): Promise<CardRef | null> => {
      const table =
        releaseTable() ??
        (await (bundledTable ??= fetch(chrome.runtime.getURL("data/cards.json"))
          .then((r) => (r.ok ? (r.json() as Promise<CardTable>) : ({} as CardTable)))
          .catch((): CardTable => ({}))));
      if (!Object.hasOwn(table, id)) return null;
      const row = table[id]!;
      return { id, art: row[2], ...(row.length > 3 ? { printed: row[3] ?? null } : {}) };
    },
    fetch: (url, init) => fetch(url, init),
  });

  const host = await startHostCompute({
    config: productConfig(__DEV__),
    win: window,
    storage: chrome.storage.local,
    createWorker: () => new Worker(workerUrl, { type: "module" }) as unknown as WorkerLike,
    loadRequest: () => loadRequest,
    now: () => performance.now(),
    ...(__IDLE_UNLOAD_MS__ !== null ? { devIdleUnloadMs: __IDLE_UNLOAD_MS__ } : {}),
    release: {
      // A build with no settings address never fetches anything: the bundled release only.
      ...(settingsUrl !== null
        ? {
            chooseRelease: (hooks: { onDownloading(): void }) =>
              chooseRelease(
                {
                  storage: chrome.storage.local,
                  readReleaseField: async () => (await createSettingsCore(SETTINGS_SCHEMA, chrome.storage.local).read()).settings.release ?? null,
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
    },
    observe: {
      onShown: channel.onShown,
      onAnalysis: (analysis: FrameAnalysis) => {
        prefetcher.onAnalysis(analysis);
        if (__DEV__) {
          const faces = analysis.boxes.filter((b) => b.face);
              frames.push({
                analyzeMs: analysis.timings.analyzeMs,
                detectorMs: analysis.timings.detectorMs,
                recognizeMs: analysis.timings.recognizeMs,
                faces: faces.length,
              });
          if (frames.length > 200) frames.shift();
        }
      },
    },
  });
  if (!host) {
    facts.close();
    return;
  }
  const { frame } = host;
  releaseTable = () => (frame.release.source === "remote" ? frame.release.table : null);

  // A tooltip frame that lacks a card's facts asks for them on the channel (one made again, or a
  // card that arrived before its facts); the frame whose release it is answers.
  facts.onmessage = (event: MessageEvent) => {
    const want = parseFactsRequest(event.data);
    const answer = want ? channel.factsFor(want.releaseId, want.cardId) : null;
    if (answer) facts.postMessage(answer);
  };
  // The host stops the session and its driver tick on pagehide; the channel is DuelSight's.
  addEventListener("pagehide", () => facts.close());

  if (__DEV__) {
    // Dev builds only: what the smoke check and the hover browser test read (test/smoke/smoke.mjs).
    (window as unknown as { __duelsightDebug: () => unknown }).__duelsightDebug = () => {
      const status = frame.core?.status() ?? null;
      return {
        // `idle`: the worker ended for idleness (the frame is about to be removed).
        state: frame.state === "idle" ? "idle" : (status?.state ?? "loading"),
        error: status?.error ?? null,
        backend: status?.backend ?? null,
        analyzed: status?.frames ?? 0,
        lastFrameError: status?.lastFrameError ?? null,
        lastWorkerMs: status?.lastWorkerMs ?? null,
        restarts: frame.restarts,
        stopped: frame.stopped,
        release: { source: frame.release.source, id: frame.release.id, reason: frame.release.reason, decision: lastDecision },
        frames,
        loadedAt,
        helloAt,
        prefetched: [...prefetcher.started],
      };
    };
  }
})();
