// SPDX-License-Identifier: Apache-2.0
// The compute frame's entry: its origin rule and the worker's lifecycle.
import { describe, expect, it } from "vitest";

import type { ReleaseStatus } from "../vendor/cardvision-browser/cardvision.js";
import { type ComputeEnv, startComputeFrame, type WorkerLike } from "../src/compute/frame.js";
import { TAG, tag } from "../src/shared/messages.js";
import { SITE_ORIGIN } from "./helpers/fork.js";

const release = {
  id: "r", game: "g", locale: "en",
  detector: { version: "d", ep: "wasm" }, recognizer: { version: "r", ep: "wasm" },
  bankCards: 1, catalogCards: 1, identityLevel: "printing",
  decode: { threshold: 0.3, nmsIou: 0.45, maxProposals: 80, minCropPx: 24 },
  accept: { tau: 0.62, delta: 0.05 }, hoverSelection: "accepted-nms", hoverMaxAgeMs: 2000,
  analysisWidth: { min: 720, max: 1920 }, ortWeb: "1.29.0",
} as unknown as NonNullable<ReleaseStatus["release"]>;

class FakeWorker implements WorkerLike {
  posted: unknown[] = [];
  terminated = false;
  onmessage: WorkerLike["onmessage"] = null;
  onerror: WorkerLike["onerror"] = null;
  postMessage(message: unknown) {
    this.posted.push(message);
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

function setup(over: Partial<ComputeEnv> = {}) {
  const toParent: Array<{ message: Record<string, unknown>; origin: string }> = [];
  const parent = { postMessage: (message: unknown, origin: string) => toParent.push({ message: message as Record<string, unknown>, origin }) };
  let listener: ((event: MessageEvent) => void) | null = null;
  const workers: FakeWorker[] = [];
  const env: ComputeEnv = {
    win: { parent, addEventListener: (_: "message", l: (event: MessageEvent) => void) => void (listener = l) },
    framed: true,
    parentOrigin: SITE_ORIGIN,
    dev: false,
    createWorker: () => {
      const w = new FakeWorker();
      workers.push(w);
      return w;
    },
    loadRequest: { kind: "load", releaseUrl: "chrome-extension://x/release/release.json", wasmPaths: "chrome-extension://x/runtime/" },
    now: () => 0,
    ...over,
  };
  const frame = startComputeFrame(env);
  const send = (data: unknown, source: unknown = parent, origin = SITE_ORIGIN) => listener?.({ data, source, origin } as unknown as MessageEvent);
  return { frame, toParent, workers, send, parent, hasListener: () => listener !== null };
}

const loaded = (w: FakeWorker) => w.reply({ kind: "release-status", ok: true, error: null, release, cards: [] });

describe("compute frame origin rule", () => {
  it.each([
    ["a page that is not a video site", { parentOrigin: "https://evil.example" }],
    ["the local test page in a release build", { parentOrigin: "http://127.0.0.1:8770" }],
    ["no embedding page", { parentOrigin: null }],
    ["a top-level tab", { framed: false }],
  ])("does not start inside %s", (_, over) => {
    const { frame, workers, hasListener, toParent } = setup(over as Partial<ComputeEnv>);
    expect(frame).toBeNull();
    expect(workers).toEqual([]);
    expect(hasListener()).toBe(false);
    expect(toParent).toEqual([]);
  });

  it("starts inside a video site, loads the release, and says ready to that origin only", () => {
    const { frame, workers, toParent } = setup();
    expect(frame).not.toBeNull();
    expect(workers[0]!.posted[0]).toMatchObject({ kind: "load" });
    expect(toParent).toEqual([{ message: tag({ kind: "ready" }), origin: SITE_ORIGIN }]);
  });

  it("acts only on messages from its parent window and origin", () => {
    const { frame, workers, send, parent } = setup();
    loaded(workers[0]!);
    const pointer = tag({ kind: "pointer", x: 0.5, y: 0.5, mediaTime: 1, touch: false });
    send(pointer, {}, SITE_ORIGIN);
    send(pointer, parent, "https://evil.example");
    expect(frame!.session.scheduler.pointerActive(0)).toBe(false);
    send(pointer, parent);
    expect(frame!.session.scheduler.pointerActive(0)).toBe(true);
  });

  it("closes a picture in a message it does not take", () => {
    const { send, parent } = setup();
    let closed = false;
    send({ [TAG]: 1, kind: "frame", requestId: 1, bitmap: { close: () => void (closed = true) }, mediaTime: 0 }, parent);
    expect(closed).toBe(true);
  });
});

describe("compute frame worker lifecycle", () => {
  it("reports a worker that fails before loading", () => {
    const { workers, toParent } = setup();
    workers[0]!.fail("no wasm");
    expect(toParent.at(-1)!.message).toMatchObject({ kind: "status", state: "failed", error: "the worker did not start (no wasm)" });
    expect(workers).toHaveLength(1);
  });

  it("restarts a worker that fails after loading once, then turns off", () => {
    const { frame, workers, toParent, send, parent } = setup();
    loaded(workers[0]!);
    workers[0]!.fail();
    expect(workers[0]!.terminated).toBe(true);
    expect(workers).toHaveLength(2);
    expect(workers[1]!.posted[0]).toMatchObject({ kind: "load" });
    expect(toParent.map((p) => p.message.kind)).toContain("shown");
    expect(frame!.restarts).toBe(1);
    // A late message from the old worker is ignored.
    workers[0]!.reply({ kind: "release-status", ok: false, error: "late", release: null, cards: [] });
    expect(frame!.session.state).toBe("loading");
    loaded(workers[1]!);
    expect(frame!.session.state).toBe("ready");
    workers[1]!.fail("again");
    expect(workers).toHaveLength(2);
    expect(frame!.stopped).toBe(true);
    expect(toParent.at(-1)!.message).toMatchObject({ kind: "status", state: "failed", error: "the recognition worker stopped (again)" });
    // Off: pictures are closed, not analyzed.
    let closed = false;
    send({ [TAG]: 1, kind: "frame", requestId: 1, bitmap: { close: () => void (closed = true) }, mediaTime: 0 }, parent);
    expect(closed).toBe(true);
  });
});

describe("compute frame and a restarted worker", () => {
  it("sends the same plain load to the restarted worker", () => {
    const { workers } = setup({});
    expect(workers[0]!.posted[0]).toMatchObject({ kind: "load" });
    loaded(workers[0]!);
    workers[0]!.fail();
    expect(workers[1]!.posted[0]).toEqual(workers[0]!.posted[0]);
  });
});
