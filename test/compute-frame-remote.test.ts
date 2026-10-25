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

async function setup(choice: ReleaseChoice | Promise<ReleaseChoice>, over: Partial<ComputeEnv> = {}) {
  const toParent: Array<Record<string, unknown>> = [];
  const workers: FakeWorker[] = [];
  const skips: string[] = [];
  const decisions: ReleaseDecision[] = [];
  const facts: CardFactsMessage[] = [];
  const order: string[] = [];
  let listener: ((e: MessageEvent) => void) | null = null;
  const env: ComputeEnv = {
    win: {
      parent: { postMessage: (m: unknown) => (toParent.push(m as Record<string, unknown>), order.push(`content:${(m as { kind: string }).kind}`)) },
      addEventListener: (_: "message", l: (e: MessageEvent) => void) => void (listener = l),
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
    ...over,
  };
  const frame = startComputeFrame(env)!;
  await new Promise((r) => setTimeout(r, 0));
  const send = (data: unknown) => listener?.({ data, source: env.win.parent, origin: SITE_ORIGIN } as unknown as MessageEvent);
  return { frame, toParent, workers, skips, decisions, facts, order, send };
}

const statusOk = (id: string) => ({ kind: "release-status", ok: true, error: null, release: releaseOf(id), cards: [] });
const statusFail = (error: string) => ({ kind: "release-status", ok: false, error, release: null, cards: [] });
const made: FakeWorker[] = [];
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

  it("while it chooses, has no session: content messages are dropped and a picture is closed", async () => {
    let resolve!: (c: ReleaseChoice) => void;
    const t = await setup(new Promise<ReleaseChoice>((r) => (resolve = r)));
    expect(t.frame.session).toBeNull();
    expect(t.frame.release.source).toBe("choosing");
    let closed = false;
    t.send({ duelsight: 1, kind: "frame", requestId: 1, mediaTime: 0, bitmap: { close: () => (closed = true) } });
    expect(closed).toBe(true);
    t.frame.tick();
    resolve(remoteChoice());
    await new Promise((r) => setTimeout(r, 0));
    expect(t.workers).toHaveLength(1);
    expect(t.frame.session).not.toBeNull();
  });

  it("ignores late messages and errors from the remote worker it replaced", async () => {
    const t = await setup(remoteChoice());
    t.workers[0]!.reply(statusFail("bank: sha256 of bank.json does not match the release"));
    t.workers[0]!.reply(statusOk(ID));
    t.workers[0]!.fail("late");
    expect(t.workers).toHaveLength(2);
    expect(t.frame.release.source).toBe("bundled");
    expect(t.frame.restarts).toBe(0);
  });

  it("an error after 'preparing' falls back, not recorded", async () => {
    const t = await setup(remoteChoice());
    t.workers[0]!.reply({ kind: "release-progress", phase: "preparing" });
    t.workers[0]!.fail("out of memory");
    expect(t.skips).toEqual([]);
    expect(isBundled(t.workers[1]!)).toBe(true);
  });

  it("2.4: a bundled fallback that then fails to load turns recognition off, as today", async () => {
    const t = await setup(remoteChoice());
    t.workers[0]!.reply(statusOk("ffffffffffffffff"));
    t.workers[1]!.reply(statusFail("no execution provider to try"));
    expect(t.frame.session!.state).toBe("failed");
    expect(t.toParent.some((m) => m.kind === "status" && m.state === "failed")).toBe(true);
    expect(t.workers).toHaveLength(2);
  });

  it("a worker that cannot be made turns recognition off instead of hanging", async () => {
    const t = await setup(remoteChoice(), {
      createWorker: () => {
        throw new Error("blocked");
      },
    });
    expect(t.frame.stopped).toBe(true);
    expect(t.toParent.some((m) => m.kind === "status" && m.state === "failed")).toBe(true);
  });

  it("12: the restart's log line names the remote release it leaves", async () => {
    const t = await setup(remoteChoice());
    t.workers[0]!.reply(statusOk(ID));
    t.workers[0]!.fail("crash");
    expect(t.decisions.at(-1)).toMatchObject({ source: "bundled", reason: "worker-restart", pointer: ID });
  });

  it("answers a tooltip's request only for a card it showed, of its own release (Addendum 2)", async () => {
    const t = await setup({ ...(remoteChoice() as Extract<ReleaseChoice, { source: "remote" }>), facts: { "999": ["New Card", null, "full/999.jpg"], "998": ["Never Shown", null, null] } });
    expect(t.frame.factsFor(ID, "999")).toBeNull();
    t.workers[0]!.reply(statusOk(ID));
    expect(t.frame.factsFor(ID, "999")).toBeNull();
    (t.frame.session as unknown as { deps: { toContent(m: unknown): void } }).deps.toContent({ kind: "shown", card: { cardId: "999", name: "New Card", box: { x: 0, y: 0, width: 0.1, height: 0.1 }, others: [] } });
    expect(t.frame.factsFor(ID, "999")).toEqual({ releaseId: ID, cardId: "999", facts: { name: "New Card", set: null, art: "full/999.jpg" } });
    expect(t.frame.factsFor(ID, "998")).toBeNull();
    expect(t.frame.factsFor("ffffffffffffffff", "999")).toBeNull();
  });

  it("says ready only once a session can take messages, so the first `presented` is not lost", async () => {
    let resolve!: (c: ReleaseChoice) => void;
    const t = await setup(new Promise<ReleaseChoice>((r) => (resolve = r)));
    expect(t.toParent.some((m) => m.kind === "ready")).toBe(false);
    resolve({ source: "bundled", reason: "absent", pointer: null, downloaded: 0, ms: 0 });
    await new Promise((r) => setTimeout(r, 0));
    expect(t.toParent.filter((m) => m.kind === "ready")).toHaveLength(1);
    expect(t.frame.session).not.toBeNull();
    // A fallback or a restart does not say ready again.
    t.workers[0]!.reply(statusOk("ffffffffffffffff"));
    t.workers[0]!.fail("crash");
    expect(t.toParent.filter((m) => m.kind === "ready")).toHaveLength(1);
  });

  it("with no pointer, the worker gets the bundled request exactly as before pointers", async () => {
    const t = await setup({ source: "bundled", reason: "absent", pointer: null, downloaded: 0, ms: 0 });
    expect(t.workers).toHaveLength(1);
    expect(t.workers[0]!.posted).toEqual([{ kind: "load", releaseUrl: "chrome-extension://x/release/release.json", wasmPaths: "w/" }]);
  });

  it("4: a fallback whose worker cannot be made turns recognition off", async () => {
    let n = 0;
    const t = await setup(remoteChoice(), {
      createWorker: () => {
        n += 1;
        if (n > 1) throw new Error("blocked");
        const w = new FakeWorker();
        made.push(w);
        return w;
      },
    });
    made[0]!.reply(statusFail("bank: sha256 of bank.json does not match the release"));
    expect(t.frame.stopped).toBe(true);
    expect(t.toParent.some((m) => m.kind === "status" && m.state === "failed")).toBe(true);
  });
});
