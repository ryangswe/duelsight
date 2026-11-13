// SPDX-License-Identifier: Apache-2.0
// DuelSight's compute frame (src/compute/frame.ts) on the toolkit's real session, with a stand-in
// worker, stand-in pictures and a stand-in hit test: a test points at a card and the frame
// captures, analyzes and shows it, as in the page.
import { vi } from "vitest";

import type { FrameAnalysis, ReleaseStatus, WorkerRequest } from "../../vendor/cardvision-browser/cardvision.js";
import type { WorkerLike } from "../../vendor/cardvision-browser/compute-session.js";
import { type DuelSightFrameEnv, startDuelSightFrame } from "../../src/compute/frame.js";
import { type CardFactsMessage, tag } from "../../src/shared/messages.js";
import { SITE_ORIGIN } from "./fork.js";

export const releaseOf = (id: string) =>
  ({
    id, game: "yugioh", locale: "en",
    detector: { version: "d", ep: "wasm" }, recognizer: { version: "r", ep: "wasm" },
    bankCards: 1, catalogCards: 1, identityLevel: "name",
    decode: { threshold: 0.3, nmsIou: 0.45, maxProposals: 80, minCropPx: 24 },
    accept: { tau: 0.68, delta: 0.06 }, hoverSelection: "accepted-nms", hoverMaxAgeMs: 2000,
    analysisWidth: { min: 720, max: 1920 }, ortWeb: "1.29.0",
  }) as unknown as NonNullable<ReleaseStatus["release"]>;

export class FakeWorker implements WorkerLike {
  posted: Array<Record<string, unknown>> = [];
  terminated = false;
  onmessage: WorkerLike["onmessage"] = null;
  onerror: WorkerLike["onerror"] = null;
  postMessage(message: unknown) {
    this.posted.push(message as Record<string, unknown>);
  }
  terminate() {
    this.terminated = true;
  }
  reply(data: unknown) {
    this.onmessage?.({ data } as MessageEvent);
  }
  fail(message = "boom") {
    this.onerror?.({ message } as ErrorEvent);
  }
}

/** Stands in for ImageBitmap (stub it as the global, so the contract's parser takes it). */
export class FakeBitmap {
  closed = false;
  constructor(
    readonly width = 1000,
    readonly height = 500,
  ) {}
  close() {
    this.closed = true;
  }
}

/** One card in the box x 100..300, y 100..400 of a 1000 x 500 frame; `scene.card` null: nothing. */
export interface Scene {
  card: { cardId: string; name: string } | null;
}

export function computeHarness(over: Partial<DuelSightFrameEnv> = {}) {
  vi.stubGlobal("ImageBitmap", FakeBitmap);
  const scene: Scene = { card: { cardId: "89631139", name: "Dark Magician" } };
  const clock = { t: 1_000 };
  const toParent: Array<{ message: Record<string, unknown>; origin: string }> = [];
  const order: string[] = [];
  const facts: CardFactsMessage[] = [];
  const workers: FakeWorker[] = [];
  let listener: ((e: MessageEvent) => void) | null = null;
  const parent = {
    postMessage: (message: Record<string, unknown>, origin: string) => {
      toParent.push({ message, origin });
      order.push(String(message.kind));
    },
  };
  const hit = (_: FrameAnalysis, x: number, y: number) =>
    scene.card && x >= 100 && x <= 300 && y >= 100 && y <= 400
      ? { card: null, boxIndex: 0, box: { x: 100, y: 100, width: 200, height: 300 }, ...scene.card }
      : { card: null, boxIndex: null, box: null, cardId: null, name: null };
  const env: DuelSightFrameEnv = {
    win: {
      parent,
      addEventListener: (_: "message", l: (e: MessageEvent) => void) => void (listener = l),
      removeEventListener: () => void (listener = null),
    },
    framed: true,
    parentOrigin: SITE_ORIGIN,
    dev: false,
    createWorker: () => {
      const w = new FakeWorker();
      workers.push(w);
      return w;
    },
    loadRequest: { kind: "load", releaseUrl: "chrome-extension://x/release/release.json", wasmPaths: "chrome-extension://x/runtime/" },
    now: () => clock.t,
    hoverAt: hit as never,
    postFacts: (m) => {
      facts.push(m);
      order.push("facts");
    },
    ...over,
  };
  const started = startDuelSightFrame(env);
  const worker = () => workers.at(-1)!;
  const sent = (kind: string) => toParent.filter((p) => p.message.kind === kind).map((p) => p.message);
  const lastShown = () => (sent("shown").at(-1)?.card ?? null) as { cardId: string; releaseId?: string; held?: true } | null;

  /** A message from the page's window, as the content script would post it. */
  const fromContent = (data: object, source: unknown = parent, origin = SITE_ORIGIN) => listener?.({ data: tag(data), source, origin } as unknown as MessageEvent);
  /** The worker loaded this release. */
  const loaded = (id = "r") => worker().reply({ kind: "release-status", ok: true, error: null, release: releaseOf(id), cards: [] });
  let mediaTime = 1;
  const answered = new Set<number>();
  /** The pointer at (x, y), in fractions, a moment later on a playing video: the capture it asks
   *  for, the picture, and the worker's answer. With `afterLoad`, the capture answered is the one
   *  still open from the end of a load instead: from toolkit 0.14.0 a frame whose model finishes
   *  loading under a pointer asks for one at once, and the move then asks for none of its own. */
  const analyzeAt = (x = 0.2, y = 0.5, { afterLoad = false } = {}) => {
    clock.t += 2_000;
    mediaTime += 1;
    const before = sent("capture").length;
    fromContent({ kind: "presented", mediaTime });
    fromContent({ kind: "pointer", x, y, mediaTime, touch: false });
    started?.frame.tick();
    const captures = sent("capture") as Array<{ requestId: number }>;
    const capture = afterLoad ? captures.slice(0, before).find((c) => !answered.has(c.requestId)) : captures[before];
    if (!capture) throw new Error(afterLoad ? "no capture open from the load" : "no capture asked for");
    answered.add(capture.requestId);
    fromContent({ kind: "frame", requestId: capture.requestId, bitmap: new FakeBitmap(), mediaTime });
    const request = worker().posted.at(-1) as unknown as Extract<WorkerRequest, { kind: "frame" }>;
    worker().reply({
      kind: "frame-result",
      envelope: request.envelope,
      videoTimeSec: request.videoTimeSec,
      width: 1000,
      height: 500,
      workerMs: 5,
      analysis: { frame: { width: 1000, height: 500 }, hover: { selection: "accepted-nms", cards: [] }, boxes: scene.card ? [{ box: [100, 100, 200, 300] }] : [] } as unknown as FrameAnalysis,
    });
  };
  return { started, env, scene, clock, toParent, order, facts, workers, worker, sent, lastShown, fromContent, loaded, analyzeAt };
}
