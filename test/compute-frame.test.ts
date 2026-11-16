// SPDX-License-Identifier: Apache-2.0
// DuelSight's compute frame on the toolkit's shared hover host (startHostCompute): the pages it
// serves, its tag, the standard options, the shown card held while the viewer reads it, and the
// card facts channel (src/compute/frame.ts). The session's own rules (the worker's restart, rules
// 10 to 12, retries, the hold's details) and the host's preset are the toolkit's and tested there.
import { afterEach, describe, expect, it, vi } from "vitest";

import { PROTOCOL_VERSION } from "../vendor/cardvision-browser/compute-session.js";
import { startHostCompute, STANDARD_PRESET } from "../vendor/cardvision-browser/host-compute.js";
import { createFactsChannel, SHOWN_IDS_LIMIT } from "../src/compute/frame.js";
import { productConfig } from "../src/shared/product.js";
import type { ReleasePointer, RemoteReleaseChoice } from "../vendor/cardvision-browser/remote-release.js";
import { computeHarness, FakeWorker, releaseOf } from "./helpers/compute-frame.js";
import { SITE_ORIGIN } from "./helpers/fork.js";
import { memoryStorage } from "./helpers/memory-storage.js";

const IDLE_UNLOAD_MS = STANDARD_PRESET.idleUnloadMs;

/** The host's own start, in a page at `origin` (undefined: none given; "null": hidden). */
async function hostStart(options: { origin?: string | undefined; framed?: boolean; dev?: boolean; idleUnloadMs?: number } = {}) {
  const { framed = true, dev = false, idleUnloadMs } = options;
  const origin = "origin" in options ? options.origin : SITE_ORIGIN;
  const toParent: Array<{ message: Record<string, unknown>; origin: string }> = [];
  const parent = { postMessage: (message: Record<string, unknown>, to: string) => void toParent.push({ message, origin: to }) };
  const win: Record<string, unknown> = {
    location: { ancestorOrigins: origin === undefined ? [] : [origin] },
    addEventListener: () => undefined,
    removeEventListener: () => undefined,
  };
  // Outside a frame, a window is its own parent.
  win.parent = framed ? parent : win;
  const host = await startHostCompute({
    config: productConfig(dev),
    win: win as never,
    storage: memoryStorage(),
    createWorker: () => new FakeWorker(),
    loadRequest: () => ({ kind: "load", releaseUrl: "chrome-extension://x/release/release.json", wasmPaths: "chrome-extension://x/runtime/" }),
    ...(idleUnloadMs !== undefined ? { devIdleUnloadMs: idleUnloadMs } : {}),
  });
  host?.stop();
  return { host, toParent };
}

const ID = "0123456789abcdef";
const pointer: ReleasePointer = { id: ID, path: `vision/releases/${ID}/release.json`, sha256: "a".repeat(64), minimumExtensionVersion: "0.3.0", maximumExtensionVersion: null };
const remoteChoice = (): RemoteReleaseChoice => ({
  source: "remote",
  pointer,
  request: { kind: "load", releaseUrl: "release.json", files: {}, wasmPaths: "w/" },
  facts: { "89631139": ["Dark Magician", "LOB", "full/89631139.jpg"], "999": ["Never Shown", null, "full/999.jpg"] },
  reused: 2,
  downloaded: 4_400_000,
  ms: 12,
});
const settle = () => new Promise((r) => setTimeout(r, 0));

afterEach(() => vi.unstubAllGlobals());

describe("compute frame: the pages it serves", () => {
  it("starts inside a video site and says ready to that origin only, under DuelSight's tag", async () => {
    const { host, toParent } = await hostStart();
    expect(host).not.toBeNull();
    const ready = toParent.find((p) => p.message.kind === "ready")!;
    expect(ready.origin).toBe(SITE_ORIGIN);
    expect(ready.message).toMatchObject({ duelsight: 1, kind: "ready", version: PROTOCOL_VERSION });
    expect(ready.message.instance).toMatch(/^[0-9a-f]{16}$/);
  });

  it.each([
    ["another site", "https://example.com"],
    ["a hidden origin (\"null\")", "null"],
    ["no origin", undefined],
    ["the local test page in a store build", "http://127.0.0.1:8770"],
  ])("does not start in %s", async (_, origin) => {
    expect((await hostStart({ origin })).host).toBeNull();
  });

  it("does not start outside a frame", async () => {
    expect((await hostStart({ framed: false })).host).toBeNull();
  });

  it("serves the local test page in a dev build", async () => {
    expect((await hostStart({ origin: "http://127.0.0.1:8770", dev: true })).host).not.toBeNull();
  });

  it("takes a shorter idle unload in a dev build only, and goes idle after it", async () => {
    await expect(hostStart({ idleUnloadMs: 6_000 })).rejects.toThrow(/development builds only/);
    const clock = { t: 1_000 };
    const workers: FakeWorker[] = [];
    const win: Record<string, unknown> = { location: { ancestorOrigins: ["http://127.0.0.1:8770"] }, addEventListener: () => undefined, removeEventListener: () => undefined };
    win.parent = { postMessage: () => undefined };
    const host = (await startHostCompute({
      config: productConfig(true),
      win: win as never,
      storage: memoryStorage(),
      createWorker: () => {
        const w = new FakeWorker();
        workers.push(w);
        return w;
      },
      loadRequest: () => ({ kind: "load", releaseUrl: "chrome-extension://x/release/release.json", wasmPaths: "chrome-extension://x/runtime/" }),
      now: () => clock.t,
      devIdleUnloadMs: 6_000,
    }))!;
    try {
      workers.at(-1)!.reply({ kind: "release-status", ok: true, error: null, release: releaseOf("r"), cards: [] });
      host.frame.tick();
      clock.t += 5_000;
      host.frame.tick();
      expect(host.frame.state).not.toBe("idle");
      clock.t += 2_000;
      host.frame.tick();
      expect(host.frame.state).toBe("idle");
    } finally {
      host.stop();
    }
  });

  it("acts only on messages from its parent window and origin", () => {
    const h = computeHarness();
    h.loaded();
    h.fromContent({ kind: "pointer", x: 0.2, y: 0.5, mediaTime: 1, touch: false }, {}, SITE_ORIGIN);
    h.fromContent({ kind: "pointer", x: 0.2, y: 0.5, mediaTime: 1, touch: false }, undefined, "https://example.com");
    expect(h.sent("capture")).toEqual([]);
    h.analyzeAt();
    expect(h.lastShown()?.cardId).toBe("89631139");
  });
});

describe("compute frame: the shown card", () => {
  it("starts with the standard options: pointer mode, measured pacing, turned cards' outlines, a 10-minute idle unload", () => {
    expect(STANDARD_PRESET).toEqual({ mode: "pointer", rotatedOutlines: true, measuredPacing: true, idleUnloadMs: 10 * 60_000 });
    expect(productConfig(false).capabilities.geometricStage).toBe(false);
  });

  it("with \"Keep the card I'm pointing at\" off, drops a card gone from under a resting pointer", () => {
    const h = computeHarness({ keepCard: false });
    h.loaded();
    h.analyzeAt();
    expect(h.lastShown()?.cardId).toBe("89631139");
    h.scene.card = null;
    for (let i = 0; i < 5; i += 1) h.analyzeAt();
    expect(h.lastShown()).toBeNull();
  });

  it("goes idle 10 minutes after the pointer leaves, not before", () => {
    const h = computeHarness();
    h.loaded();
    h.analyzeAt();
    h.fromContent({ kind: "leave" });
    for (let i = 0; i < 5; i += 1) h.started!.frame.tick();
    h.clock.t += IDLE_UNLOAD_MS - 1_000;
    h.started!.frame.tick();
    expect(h.started!.frame.state).not.toBe("idle");
    h.clock.t += 2_000;
    h.started!.frame.tick();
    expect(h.started!.frame.state).toBe("idle");
    expect(h.sent("status").at(-1)).toMatchObject({ state: "idle" });
  });

  it("does not go idle while a card is kept under a resting pointer, however long", () => {
    const h = computeHarness();
    h.loaded();
    h.analyzeAt();
    h.scene.card = null;
    for (let i = 0; i < 3; i += 1) h.analyzeAt();
    expect(h.lastShown()?.held).toBe(true);
    for (let i = 0; i < 60; i += 1) {
      h.clock.t += 60_000;
      h.started!.frame.tick();
    }
    expect(h.started!.frame.state).not.toBe("idle");
    expect(h.lastShown()?.cardId).toBe("89631139");
  });

  it("keeps the card, marked held, while the pointer stays after the card is gone from there", () => {
    const h = computeHarness();
    h.loaded();
    h.analyzeAt();
    expect(h.lastShown()?.cardId).toBe("89631139");
    expect(h.lastShown()?.held).toBeUndefined();
    // Nothing there any more (a player moved the card), analysis after analysis: still shown,
    // marked held (the short hold, SHOWN_HOLD, would drop it on the second).
    h.scene.card = null;
    for (let i = 0; i < 5; i += 1) h.analyzeAt();
    expect(h.lastShown()?.cardId).toBe("89631139");
    expect(h.lastShown()?.held).toBe(true);
  });
});

describe("compute frame: card facts", () => {
  it("with the remote release confirmed, a shown card carries its id and its facts go out first", async () => {
    const h = computeHarness({ chooseRelease: async () => remoteChoice() });
    await settle();
    h.loaded(ID);
    h.analyzeAt();
    expect(h.lastShown()).toMatchObject({ cardId: "89631139", releaseId: ID });
    expect(h.facts).toEqual([{ releaseId: ID, cardId: "89631139", facts: { name: "Dark Magician", set: "LOB", art: "full/89631139.jpg" } }]);
    expect(h.order.slice(h.order.indexOf("facts"), h.order.indexOf("facts") + 2)).toEqual(["facts", "shown"]);
  });

  it("answers a tooltip's request only for a card it showed, of the release in effect", async () => {
    const h = computeHarness({ chooseRelease: async () => remoteChoice() });
    await settle();
    h.loaded(ID);
    const facts = h.started!.facts;
    expect(facts.factsFor(ID, "89631139")).toBeNull();
    h.analyzeAt();
    expect(facts.factsFor(ID, "89631139")?.facts.name).toBe("Dark Magician");
    expect(facts.factsFor(ID, "999")).toBeNull();
    expect(facts.factsFor("fedcba9876543210", "89631139")).toBeNull();
  });

  it("sends no facts and no release id for the bundled release", () => {
    const h = computeHarness();
    h.loaded();
    h.analyzeAt();
    expect(h.lastShown()).toEqual(expect.not.objectContaining({ releaseId: expect.anything() }));
    expect(h.facts).toEqual([]);
    expect(h.started!.facts.factsFor(ID, "89631139")).toBeNull();
  });

  it("stops sending facts once a restart left the remote release (rule 12)", async () => {
    const h = computeHarness({ chooseRelease: async () => remoteChoice() });
    await settle();
    h.loaded(ID);
    h.analyzeAt();
    h.worker().fail();
    const asked = h.sent("capture").length;
    h.loaded();
    // The load ends under the pointer: the frame asks for a picture at once (toolkit 0.14.0).
    expect(h.sent("capture")).toHaveLength(asked + 1);
    h.analyzeAt(0.21, 0.5, { afterLoad: true });
    expect(h.started!.frame.release.source).toBe("bundled");
    expect(h.lastShown()?.releaseId).toBeUndefined();
    expect(h.facts).toHaveLength(1);
    expect(h.started!.facts.factsFor(ID, "89631139")).toBeNull();
  });

  it("keeps at most SHOWN_IDS_LIMIT shown ids, oldest dropped first", () => {
    const posted: string[] = [];
    const channel = createFactsChannel((m) => posted.push(m.cardId));
    const table: Record<string, [string, null, null]> = {};
    for (let i = 0; i <= SHOWN_IDS_LIMIT; i += 1) table[`c${i}`] = [`Card ${i}`, null, null];
    const release = { source: "remote" as const, id: ID, reason: "ok", table };
    for (let i = 0; i <= SHOWN_IDS_LIMIT; i += 1) channel.onShown({ cardId: `c${i}`, name: `Card ${i}`, releaseId: ID, box: { x: 0, y: 0, width: 1, height: 1 }, others: [] }, release);
    expect(posted).toHaveLength(SHOWN_IDS_LIMIT + 1);
    expect(channel.factsFor(ID, "c0")).toBeNull();
    expect(channel.factsFor(ID, `c${SHOWN_IDS_LIMIT}`)?.facts.name).toBe(`Card ${SHOWN_IDS_LIMIT}`);
  });
});
