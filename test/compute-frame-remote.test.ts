// SPDX-License-Identifier: Apache-2.0
// The compute frame with a remote release (rules 10-12, 2.4, Addendum 1 A2, Addendum 2).
import { describe, expect, it } from "vitest";

import type { ReleaseStatus } from "../vendor/cardvision-browser/cardvision.js";
import { type ComputeEnv, type ReleaseChoice, type ReleaseDecision, startComputeFrame, type WorkerLike } from "../src/compute/frame.js";
import type { CardFactsMessage } from "../src/shared/messages.js";
import type { ReleasePointer } from "../src/release/pointer.js";
import { SITE_ORIGIN } from "./helpers/fork.js";

const ID = "0123456789abcdef";
const pointer: ReleasePointer = { id: ID, path: `vision/releases/${ID}/release.json`, sha256: "a".repeat(64), minimumExtensionVersion: "0.3.0", maximumExtensionVersion: null };
const releaseOf = (id: string) =>
  ({
    id, game: "yugioh", locale: "en",
    detector: { version: "d", ep: "wasm" }, recognizer: { version: "r", ep: "wasm" },
    bankCards: 1, catalogCards: 1, identityLevel: "name",
    decode: { threshold: 0.3, nmsIou: 0.45, maxProposals: 80, minCropPx: 24 },
    accept: { tau: 0.68, delta: 0.06 }, hoverSelection: "accepted-nms", hoverMaxAgeMs: 2000,
    analysisWidth: { min: 720, max: 1920 }, ortWeb: "1.29.0",
  }) as unknown as NonNullable<ReleaseStatus["release"]>;

class FakeWorker implements WorkerLike {
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

const remoteChoice = (): ReleaseChoice => ({
  source: "remote",
  pointer,
  request: { kind: "load", releaseUrl: "release.json", files: {}, wasmPaths: "w/" },
  facts: { "999": ["New Card", null, "full/999.jpg"] },
  reused: 2,
  downloaded: 4_400_000,
  ms: 12,
});

async function setup(choice: ReleaseChoice) {
  const toParent: Array<Record<string, unknown>> = [];
  const workers: FakeWorker[] = [];
  const skips: string[] = [];
  const decisions: ReleaseDecision[] = [];
  const facts: CardFactsMessage[] = [];
  const order: string[] = [];
  const env: ComputeEnv = {
    win: {
      parent: { postMessage: (m: unknown) => (toParent.push(m as Record<string, unknown>), order.push(`content:${(m as { kind: string }).kind}`)) },
      addEventListener: () => undefined,
    },
    framed: true,
    parentOrigin: SITE_ORIGIN,
    dev: false,
    createWorker: () => {
      const w = new FakeWorker();
      workers.push(w);
      return w;
    },
    loadRequest: { kind: "load", releaseUrl: "chrome-extension://x/release/release.json", wasmPaths: "w/" },
    now: () => 0,
    chooseRelease: async () => choice,
    recordSkip: (_, reason) => skips.push(reason),
    onDecision: (d) => decisions.push(d),
    postFacts: (m) => (facts.push(m), order.push("facts")),
  };
  const frame = startComputeFrame(env)!;
  await new Promise((r) => setTimeout(r, 0));
  return { frame, toParent, workers, skips, decisions, facts, order };
}

const statusOk = (id: string) => ({ kind: "release-status", ok: true, error: null, release: releaseOf(id), cards: [] });
const statusFail = (error: string) => ({ kind: "release-status", ok: false, error, release: null, cards: [] });
const isBundled = (w: FakeWorker) => w.posted[0]?.releaseUrl === "chrome-extension://x/release/release.json";

describe("compute frame, remote release", () => {
  it("loads the remote release; once the worker confirms its id, shown cards carry it and their facts go out first", async () => {
    const t = await setup(remoteChoice());
    expect(t.workers).toHaveLength(1);
    expect(t.workers[0]!.posted[0]).toMatchObject({ kind: "load", releaseUrl: "release.json" });
    t.workers[0]!.reply(statusOk(ID));
    expect(t.frame.release).toEqual({ source: "remote", id: ID, reason: "ok" });
    expect(t.decisions).toEqual([{ source: "remote", reason: "ok", pointer: ID, reused: 2, downloaded: 4_400_000, ms: 12 }]);
    // The session publishes a shown card: facts first, by the channel, then `shown` with the release id.
    const s = t.frame.session!;
    (s as unknown as { deps: { toContent(m: unknown): void } }).deps.toContent({ kind: "shown", card: { cardId: "999", name: "New Card", box: { x: 0, y: 0, width: 0.1, height: 0.1 }, others: [] } });
    expect(t.facts).toEqual([{ releaseId: ID, cardId: "999", facts: { name: "New Card", set: null, art: "full/999.jpg" } }]);
    const shown = t.toParent.filter((m) => m.kind === "shown").pop() as { card: { releaseId?: string } };
    expect(shown.card.releaseId).toBe(ID);
    expect(t.order.slice(-2)).toEqual(["facts", "content:shown"]);
  });

  it("10: a refusal before 'preparing' is recorded; a new worker loads the bundled release, without using the restart", async () => {
    const t = await setup(remoteChoice());
    t.workers[0]!.reply({ kind: "release-progress", phase: "downloading", bytes: 1 });
    t.workers[0]!.reply(statusFail("bank: sha256 of bank.json does not match the release"));
    expect(t.skips).toEqual(["runtime:bank: sha256 of bank.json does not match the release"]);
    expect(t.workers[0]!.terminated).toBe(true);
    expect(isBundled(t.workers[1]!)).toBe(true);
    expect(t.frame.restarts).toBe(0);
    expect(t.toParent.some((m) => m.kind === "status" && m.state === "failed")).toBe(false);
    t.workers[1]!.reply(statusOk("ffffffffffffffff"));
    expect(t.frame.session!.state).toBe("ready");
    expect(t.frame.release).toMatchObject({ source: "bundled", id: null });
  });

  it("10: a refusal after 'preparing', or the runtime's catch-all, is not recorded (A3)", async () => {
    const a = await setup(remoteChoice());
    a.workers[0]!.reply({ kind: "release-progress", phase: "preparing" });
    a.workers[0]!.reply(statusFail("detector: the model did not initialize on any execution provider"));
    expect(a.skips).toEqual([]);
    expect(isBundled(a.workers[1]!)).toBe(true);
    const b = await setup(remoteChoice());
    b.workers[0]!.reply(statusFail("unexpected: RangeError: memory"));
    expect(b.skips).toEqual([]);
  });

  it("10: a worker that never started falls back, not recorded", async () => {
    const t = await setup(remoteChoice());
    t.workers[0]!.fail("script error");
    expect(t.skips).toEqual([]);
    expect(isBundled(t.workers[1]!)).toBe(true);
    expect(t.frame.restarts).toBe(0);
  });

  it("11: another id than the pointer's ends that worker, records it, and loads the bundled release; no facts go out", async () => {
    const t = await setup(remoteChoice());
    t.workers[0]!.reply(statusOk("ffffffffffffffff"));
    expect(t.skips).toEqual(["id-mismatch"]);
    expect(t.workers[0]!.terminated).toBe(true);
    expect(isBundled(t.workers[1]!)).toBe(true);
    t.workers[1]!.reply(statusOk("ffffffffffffffff"));
    const s = t.frame.session!;
    (s as unknown as { deps: { toContent(m: unknown): void } }).deps.toContent({ kind: "shown", card: { cardId: "999", name: "X", box: { x: 0, y: 0, width: 0.1, height: 0.1 }, others: [] } });
    expect(t.facts).toEqual([]);
    const shown = t.toParent.filter((m) => m.kind === "shown").pop() as { card: { releaseId?: string } };
    expect(shown.card.releaseId).toBeUndefined();
  });

  it("12: a remote worker that crashes after loading restarts once, on the bundled release; then the normal budget", async () => {
    const t = await setup(remoteChoice());
    t.workers[0]!.reply(statusOk(ID));
    t.workers[0]!.fail("crash");
    expect(t.frame.restarts).toBe(1);
    expect(isBundled(t.workers[1]!)).toBe(true);
    expect(t.frame.release).toEqual({ source: "bundled", id: null, reason: "worker-restart" });
    t.workers[1]!.reply(statusOk("ffffffffffffffff"));
    t.workers[1]!.fail("again");
    expect(t.frame.stopped).toBe(true);
    expect(t.workers).toHaveLength(2);
  });

  it("a bundled choice starts the bundled release and logs its reason", async () => {
    const t = await setup({ source: "bundled", reason: "same-as-bundled", pointer, downloaded: 0, ms: 1 });
    expect(isBundled(t.workers[0]!)).toBe(true);
    expect(t.decisions).toEqual([{ source: "bundled", reason: "same-as-bundled", pointer: ID, reused: 0, downloaded: 0, ms: 1 }]);
    expect(t.frame.release).toMatchObject({ source: "bundled", reason: "same-as-bundled" });
  });
});
