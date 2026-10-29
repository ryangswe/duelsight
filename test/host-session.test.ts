// SPDX-License-Identifier: Apache-2.0
// The compute frame's session: the message plumbing between the content script, the session
// and the runtime's worker, with the runtime's real scheduler and a stand-in hit test.
import { beforeEach, describe, expect, it } from "vitest";

import type { FrameAnalysis, FrameResult, ReleaseStatus, WorkerRequest } from "../vendor/cardvision-browser/cardvision.js";
import { CAPTURE_RETRY_MS, HOLD_MAX_MS, HOLD_MISSES, HostSession, WATCHDOG_MS } from "../src/compute/host-session.js";
import type { ComputeOut } from "../src/shared/messages.js";

const release: NonNullable<ReleaseStatus["release"]> = {
  id: "r",
  game: "one-piece-tcg",
  locale: "en",
  detector: { version: "d", ep: "wasm" },
  recognizer: { version: "r", ep: "wasm" },
  bankCards: 2,
  catalogCards: 2,
  identityLevel: "printing",
  decode: { threshold: 0.3, nmsIou: 0.45, maxProposals: 80, minCropPx: 24 },
  accept: { tau: 0.62, delta: 0.05 } as never,
  hoverSelection: "accepted-nms",
  hoverMaxAgeMs: 2000,
  analysisWidth: { min: 720, max: 1920 },
  ortWeb: "1.29.0",
};

/** What the detector finds in the next analyses: the card's own box, another box at the same
 *  place that barely overlaps it, or nothing. */
const detected: { box: "card" | "other" | "none" } = { box: "card" };
const analysisNow = (): FrameAnalysis =>
  ({
    frame: { width: 1000, height: 500 },
    hover: { selection: "accepted-nms", cards: [] },
    boxes:
      detected.box === "card" ? [{ box: [100, 100, 200, 300] }] : detected.box === "other" ? [{ box: [150, 200, 60, 80] }] : [],
  }) as unknown as FrameAnalysis;

/** A hit test with one card: by default 89631139 in the box x 100..300, y 100..400 of a
 *  1000 x 500 frame. `scene.card` changes what the next analyses see there (null: nothing). */
const scene: { card: { cardId: string; name: string } | null } = { card: { cardId: "89631139", name: "Dark Magician" } };
const hit = (_: FrameAnalysis, x: number, y: number) =>
  scene.card && x >= 100 && x <= 300 && y >= 100 && y <= 400
    ? { card: null, boxIndex: 0, box: { x: 100, y: 100, width: 200, height: 300 }, ...scene.card }
    : { card: null, boxIndex: null, box: null, cardId: null, name: null };

let clock = 0;
let toWorker: Array<{ request: WorkerRequest; transfer?: Transferable[] }>;
let toContent: ComputeOut[];
let session: HostSession;

const bitmap = () => {
  const b = { closed: false, close() { this.closed = true; } };
  return b as unknown as ImageBitmap & { closed: boolean };
};
const captures = () => toContent.filter((m): m is Extract<ComputeOut, { kind: "capture" }> => m.kind === "capture");
const shownMessages = () => toContent.filter((m): m is Extract<ComputeOut, { kind: "shown" }> => m.kind === "shown");
const lastShown = () => shownMessages().at(-1)?.card ?? null;

function reply(request: WorkerRequest, result: Partial<FrameResult> = {}): FrameResult {
  if (request.kind !== "frame") throw new Error("not a frame request");
  return { kind: "frame-result", envelope: request.envelope, videoTimeSec: request.videoTimeSec, width: 1000, height: 500, workerMs: 5, analysis: analysisNow(), ...result };
}

function ready(): void {
  session.fromWorker({ kind: "release-status", ok: true, error: null, release, cards: [] });
}

/** Pointer at (x, y) in fractions; runs the capture → frame → reply round trip it starts. */
function analyzeAt(x: number, y: number, mediaTime = 1): void {
  session.fromContent({ kind: "pointer", x, y, mediaTime, touch: false });
  const capture = captures().at(-1)!;
  session.fromContent({ kind: "frame", requestId: capture.requestId, bitmap: bitmap(), mediaTime });
  session.fromWorker(reply(toWorker.at(-1)!.request));
}

beforeEach(() => {
  scene.card = { cardId: "89631139", name: "Dark Magician" };
  detected.box = "card";
  clock = 1_000;
  toWorker = [];
  toContent = [];
  session = new HostSession({
    now: () => clock,
    toWorker: (request, transfer) => toWorker.push({ request, transfer }),
    toContent: (m) => toContent.push(m),
    hoverAt: hit as never,
  });
});

describe("HostSession", () => {
  it("reports the release status to the content script", () => {
    ready();
    expect(toContent[0]).toEqual({ kind: "status", state: "ready", error: null, backend: "wasm" });
    session.fromWorker({ kind: "release-status", ok: false, error: "release: HTTP 404", release: null, cards: [] });
    expect(toContent[1]).toEqual({ kind: "status", state: "failed", error: "release: HTTP 404", backend: "wasm" });
  });

  it("asks for nothing before the release has loaded", () => {
    session.fromContent({ kind: "pointer", x: 0.2, y: 0.5, mediaTime: 1, touch: false });
    clock += 2000;
    session.tick();
    expect(captures()).toEqual([]);
  });

  it("asks for a picture when the pointer moves over a stale picture, at the release's analysis width", () => {
    ready();
    session.fromContent({ kind: "pointer", x: 0.2, y: 0.5, mediaTime: 1, touch: false });
    expect(captures()).toEqual([{ kind: "capture", requestId: 1, analysisWidth: { min: 720, max: 1920 } }]);
  });

  it("transfers the captured picture to the worker with its envelope", () => {
    ready();
    session.fromContent({ kind: "pointer", x: 0.2, y: 0.5, mediaTime: 1.5, touch: false });
    const b = bitmap();
    session.fromContent({ kind: "frame", requestId: 1, bitmap: b, mediaTime: 1.5 });
    expect(toWorker).toHaveLength(1);
    expect(toWorker[0]!.request).toEqual({ kind: "frame", bitmap: b, videoTimeSec: 1.5, envelope: { requestId: 1, mediaTimeSec: 1.5, generation: 0, videoKey: "source-0" } });
    expect(toWorker[0]!.transfer).toEqual([b]);
  });

  it("closes a picture it did not ask for", () => {
    ready();
    const b = bitmap();
    session.fromContent({ kind: "frame", requestId: 9, bitmap: b, mediaTime: 1 });
    expect(b.closed).toBe(true);
    expect(toWorker).toEqual([]);
  });

  it("names the card under the pointer, with its box in fractions of the frame", () => {
    ready();
    analyzeAt(0.2, 0.5);
    expect(lastShown()).toMatchObject({ cardId: "89631139", name: "Dark Magician", box: { x: 0.1, y: 0.2, width: 0.2, height: 0.6 } });
    session.fromContent({ kind: "pointer", x: 0.8, y: 0.5, mediaTime: 1, touch: false });
    expect(lastShown()).toBeNull();
    session.fromContent({ kind: "pointer", x: 0.25, y: 0.5, mediaTime: 1, touch: false });
    expect(lastShown()?.cardId).toBe("89631139");
  });

  it("does not repeat an unchanged answer", () => {
    ready();
    analyzeAt(0.2, 0.5);
    const n = shownMessages().length;
    session.fromContent({ kind: "pointer", x: 0.21, y: 0.5, mediaTime: 1, touch: false });
    expect(shownMessages().length).toBe(n);
  });

  it("clears the answer when the pointer leaves", () => {
    ready();
    analyzeAt(0.2, 0.5);
    session.fromContent({ kind: "leave" });
    expect(lastShown()).toBeNull();
  });

  it("shows nothing for a reply from before a seek", () => {
    ready();
    session.fromContent({ kind: "pointer", x: 0.2, y: 0.5, mediaTime: 1, touch: false });
    session.fromContent({ kind: "frame", requestId: 1, bitmap: bitmap(), mediaTime: 1 });
    session.fromContent({ kind: "discontinuity", newSource: false });
    session.fromWorker(reply(toWorker[0]!.request));
    expect(lastShown()).toBeNull();
    // The request is finished: the next one can go, and the seek made the picture stale.
    clock += 300;
    session.fromContent({ kind: "pointer", x: 0.2, y: 0.5, mediaTime: 1, touch: false });
    expect(captures().length).toBe(2);
  });

  it("clears what is shown on a new source", () => {
    ready();
    analyzeAt(0.2, 0.5);
    session.fromContent({ kind: "discontinuity", newSource: true });
    expect(lastShown()).toBeNull();
  });

  it("holds a card past hover.maxAgeMs only briefly, and then shows nothing", () => {
    ready();
    analyzeAt(0.2, 0.5, 1);
    session.fromContent({ kind: "presented", mediaTime: 2.9 });
    expect(session.fresh()?.cardId).toBe("89631139");
    session.fromContent({ kind: "presented", mediaTime: 3.1 });
    // The result is too old to name anything itself; the shown card is held until the next
    // analysis, at most HOLD_MAX_MS.
    expect(session.fresh()).toBeNull();
    expect(lastShown()?.cardId).toBe("89631139");
    clock += HOLD_MAX_MS;
    session.fromContent({ kind: "presented", mediaTime: 3.2 });
    expect(lastShown()).toBeNull();
  });

  it("shows nothing when the worker could not analyze the frame", () => {
    ready();
    session.fromContent({ kind: "pointer", x: 0.2, y: 0.5, mediaTime: 1, touch: false });
    session.fromContent({ kind: "frame", requestId: 1, bitmap: bitmap(), mediaTime: 1 });
    session.fromWorker(reply(toWorker[0]!.request, { analysis: null, error: "busy" }));
    expect(lastShown()).toBeNull();
    expect(session.lastFrameError).toBe("busy");
  });

  it("keeps one request in flight, and gives up on it after the watchdog", () => {
    ready();
    session.fromContent({ kind: "pointer", x: 0.2, y: 0.5, mediaTime: 1, touch: false });
    clock += 600;
    session.fromContent({ kind: "pointer", x: 0.3, y: 0.5, mediaTime: 5, touch: false });
    session.tick();
    expect(captures().length).toBe(1);
    clock += WATCHDOG_MS + 1;
    session.tick();
    expect(session.lastFrameError).toBe("no reply");
    expect(captures().length).toBe(2);
    // The late picture of the first request is dropped, never analyzed.
    const late = bitmap();
    session.fromContent({ kind: "frame", requestId: 1, bitmap: late, mediaTime: 1 });
    expect(late.closed).toBe(true);
  });

  it("frees the request when the picture could not be read", () => {
    ready();
    session.fromContent({ kind: "pointer", x: 0.2, y: 0.5, mediaTime: 1, touch: false });
    session.fromContent({ kind: "capture-failed", requestId: 1, reason: "the video may not be read" });
    expect(session.lastFrameError).toBe("capture-failed: the video may not be read");
    // The still picture is looked at again on the next tick.
    clock += 300;
    session.tick();
    expect(captures().length).toBe(2);
  });

  /** The content script's answer when the picture itself could not be had. */
  const noPicture = (requestId = captures().at(-1)!.requestId) =>
    session.fromContent({ kind: "capture-failed", requestId, reason: "no picture", retry: true });
  const at = (ms: number) => {
    clock += ms;
    session.tick();
  };

  it("keeps trying a paused video whose picture is not ready, with a back-off", () => {
    ready();
    session.fromContent({ kind: "pointer", x: 0.2, y: 0.5, mediaTime: 1, touch: false });
    noPicture();
    // Exhaust the scheduler's own repeats (before the fix the video then stalled for good).
    for (let i = 0; i < 4; i += 1) {
      const n = captures().length;
      at(260);
      if (captures().length > n) noPicture();
    }
    // Retries keep coming on the back-off (at most 2 s apart) while the pointer moved recently.
    const n = captures().length;
    for (let i = 0; i < 40; i += 1) {
      const before = captures().length;
      at(100);
      if (captures().length > before) noPicture();
    }
    expect(captures().length - n).toBeGreaterThanOrEqual(2);
    expect(CAPTURE_RETRY_MS.at(-1)).toBe(2_000);
    // When the video becomes readable, the picture is analyzed and named.
    at(2_010);
    const capture = captures().at(-1)!;
    session.fromContent({ kind: "frame", requestId: capture.requestId, bitmap: bitmap(), mediaTime: 1 });
    session.fromWorker(reply(toWorker.at(-1)!.request));
    expect(lastShown()?.cardId).toBe("89631139");
  });

  it("does not retry a refusal that is not about the picture", () => {
    ready();
    session.fromContent({ kind: "pointer", x: 0.2, y: 0.5, mediaTime: 1, touch: false });
    session.fromContent({ kind: "capture-failed", requestId: 1, reason: "no pointer over the player", retry: false });
    // Past the scheduler's own repeats, nothing more is asked.
    for (let i = 0; i < 6; i += 1) {
      const n = captures().length;
      at(260);
      if (captures().length > n) session.fromContent({ kind: "capture-failed", requestId: captures().at(-1)!.requestId, reason: "no pointer over the player", retry: false });
    }
    const n = captures().length;
    for (let i = 0; i < 10; i += 1) at(1_000);
    expect(captures().length).toBe(n);
  });

  it("stops retrying once the pointer has rested for the grace period", () => {
    ready();
    session.fromContent({ kind: "pointer", x: 0.2, y: 0.5, mediaTime: 1, touch: false });
    noPicture();
    for (let i = 0; i < 12; i += 1) {
      const n = captures().length;
      at(1_000);
      if (captures().length > n) noPicture();
    }
    const n = captures().length;
    for (let i = 0; i < 10; i += 1) at(2_000);
    expect(captures().length).toBe(n);
    // Moving the pointer again asks once more.
    session.fromContent({ kind: "pointer", x: 0.21, y: 0.5, mediaTime: 1, touch: false });
    at(260);
    expect(captures().length).toBeGreaterThan(n);
  });

  it("stops trying when the pointer leaves, and starts the back-off over on a seek", () => {
    ready();
    session.fromContent({ kind: "pointer", x: 0.2, y: 0.5, mediaTime: 1, touch: false });
    noPicture(1);
    session.fromContent({ kind: "leave" });
    for (let i = 0; i < 12; i += 1) at(1_000);
    const n = captures().length;
    for (let i = 0; i < 20; i += 1) at(1_000);
    expect(captures().length).toBe(n);
  });

  it("goes idle 10 s after the last pointer activity when nothing is shown", () => {
    ready();
    session.fromContent({ kind: "pointer", x: 0.8, y: 0.5, mediaTime: 1, touch: false });
    session.fromContent({ kind: "frame", requestId: 1, bitmap: bitmap(), mediaTime: 1 });
    session.fromWorker(reply(toWorker[0]!.request));
    const before = captures().length;
    for (let t = 0; t < 30; t += 1) {
      clock += 1000;
      session.fromContent({ kind: "presented", mediaTime: 1 + t + 1 });
      session.tick();
    }
    const during = captures().length - before;
    expect(session.scheduler.analysisState(clock)).toBe("idle");
    const idleSince = captures().length;
    for (let t = 0; t < 10; t += 1) {
      clock += 1000;
      session.fromContent({ kind: "presented", mediaTime: 40 + t });
      session.tick();
    }
    expect(captures().length).toBe(idleSince);
    expect(during).toBeGreaterThan(0);
  });
});

describe("HostSession and a stage report from the runtime", () => {
  it("ignores a geometric-status reply, without touching what is shown", () => {
    const s = new HostSession({ now: () => 0, toWorker: () => undefined, toContent: (m) => toContent.push(m) });
    toContent = [];
    s.fromWorker({ kind: "geometric-status", state: "off", reason: "no-webgpu", bytes: null });
    expect(toContent).toEqual([]);
  });
});

describe("HostSession hysteresis (a live stream)", () => {
  /** One more analysis of the picture, as the scheduler would start it. */
  function analyzeAgain(mediaTime: number): void {
    const n = captures().length;
    // At the slow cadence of a resting pointer (2 s on WebAssembly), the gap that used to blink.
    clock += 2100;
    session.fromContent({ kind: "presented", mediaTime });
    session.tick();
    expect(captures().length).toBe(n + 1);
    const capture = captures().at(-1)!;
    session.fromContent({ kind: "frame", requestId: capture.requestId, bitmap: bitmap(), mediaTime });
    session.fromWorker(reply(toWorker.at(-1)!.request));
  }

  it("does not hide on a single analysis with nothing there; hides after HOLD_MISSES in a row", () => {
    ready();
    analyzeAt(0.2, 0.5, 1);
    expect(lastShown()?.cardId).toBe("89631139");
    scene.card = null;
    analyzeAgain(1.3);
    expect(lastShown()?.cardId).toBe("89631139");
    for (let i = 1; i < HOLD_MISSES; i += 1) analyzeAgain(1.3 + i * 0.3);
    expect(lastShown()).toBeNull();
  });

  it("hides once no analysis has seen the card for HOLD_MAX_MS", () => {
    ready();
    analyzeAt(0.2, 0.5, 1);
    scene.card = null;
    analyzeAgain(1.3);
    expect(lastShown()?.cardId).toBe("89631139");
    clock += HOLD_MAX_MS;
    session.tick();
    expect(lastShown()).toBeNull();
  });

  it("never flickers when acceptance toggles from one analysis to the next", () => {
    ready();
    analyzeAt(0.2, 0.5, 1);
    const before = shownMessages().length;
    for (let i = 0; i < 10; i += 1) {
      scene.card = i % 2 ? { cardId: "89631139", name: "Dark Magician" } : null;
      analyzeAgain(1.3 + i * 0.3);
    }
    expect(shownMessages().slice(before).filter((m) => m.card === null)).toEqual([]);
    expect(lastShown()?.cardId).toBe("89631139");
  });

  it("replaces the card at once when another one is accepted there", () => {
    ready();
    analyzeAt(0.2, 0.5, 1);
    scene.card = { cardId: "83764718", name: "Red-Eyes Black Dragon" };
    analyzeAgain(1.3);
    expect(lastShown()?.cardId).toBe("83764718");
  });

  it("ends at once when the pointer leaves the shown card's box", () => {
    ready();
    analyzeAt(0.2, 0.5, 1);
    scene.card = null;
    analyzeAgain(1.3);
    expect(lastShown()?.cardId).toBe("89631139");
    session.fromContent({ kind: "pointer", x: 0.8, y: 0.5, mediaTime: 1.3, touch: false });
    expect(lastShown()).toBeNull();
  });

  it("drops the hold at once when another box is detected at the pointer", () => {
    ready();
    analyzeAt(0.2, 0.5, 1);
    scene.card = null;
    detected.box = "other";
    analyzeAgain(1.3);
    expect(lastShown()).toBeNull();
  });

  it("counts no box at the pointer as a miss: held once, gone after HOLD_MISSES", () => {
    ready();
    analyzeAt(0.2, 0.5, 1);
    scene.card = null;
    detected.box = "none";
    analyzeAgain(1.3);
    expect(lastShown()?.cardId).toBe("89631139");
    for (let i = 1; i < HOLD_MISSES; i += 1) analyzeAgain(1.3 + i * 0.3);
    expect(lastShown()).toBeNull();
  });

  it("holds while the same box is detected there but not accepted this time", () => {
    ready();
    analyzeAt(0.2, 0.5, 1);
    scene.card = null;
    detected.box = "card";
    analyzeAgain(1.3);
    expect(lastShown()?.cardId).toBe("89631139");
  });

  it("ends at once on a seek", () => {
    ready();
    analyzeAt(0.2, 0.5, 1);
    session.fromContent({ kind: "discontinuity", newSource: false });
    expect(lastShown()).toBeNull();
  });
});

describe("HostSession on a paused video when the first analysis is slow", () => {
  /** The pointer moves over the paused picture (video time 3 s) and the session runs a tick. */
  const wiggle = (i: number) => {
    session.fromContent({ kind: "pointer", x: 0.2 + (i % 2) * 0.001, y: 0.5, mediaTime: 3, touch: false });
    session.tick();
  };
  /** Hands the worker the picture of the newest capture, if it was not handed over yet. */
  const handOver = (): WorkerRequest | null => {
    const capture = captures().at(-1);
    if (!capture || toWorker.some((w) => w.request.kind === "frame" && w.request.envelope.requestId === capture.requestId)) return null;
    session.fromContent({ kind: "frame", requestId: capture.requestId, bitmap: bitmap(), mediaTime: 3 });
    return toWorker.at(-1)!.request;
  };

  it("looks again after busy answers and a late answer, and shows the card", () => {
    ready();
    session.fromContent({ kind: "presented", mediaTime: 3 });
    // The worker takes 9 s for the first picture; each picture sent meanwhile is answered busy.
    let slow: WorkerRequest | null = null;
    let busyUntil = 0;
    for (let i = 0; i < 60; i += 1) {
      wiggle(i);
      const sent = handOver();
      if (sent && slow === null) {
        slow = sent;
        busyUntil = clock + 9_000;
      } else if (sent && clock < busyUntil) {
        session.fromWorker(reply(sent, { analysis: null as never, error: "busy" }));
      } else if (sent) {
        session.fromWorker(reply(sent));
      }
      if (slow && clock >= busyUntil && busyUntil > 0) {
        // The slow answer arrives after the session gave up on it, and is dropped.
        session.fromWorker(reply(slow));
        busyUntil = 0;
      }
      clock += 250;
    }
    expect(toWorker.filter((w) => w.request.kind === "frame").length).toBeGreaterThan(3);
    expect(session.framesAnalyzed).toBeGreaterThan(0);
    expect(lastShown()).toMatchObject({ cardId: "89631139" });
  });

  it("backs off between looks while the worker stays busy", () => {
    ready();
    session.fromContent({ kind: "presented", mediaTime: 3 });
    const sentAt: number[] = [];
    for (let i = 0; i < 120; i += 1) {
      wiggle(i);
      const sent = handOver();
      if (sent) {
        sentAt.push(clock);
        // The first picture never comes back; every later one is answered busy.
        if (sentAt.length > 1) session.fromWorker(reply(sent, { analysis: null as never, error: "busy" }));
      }
      clock += 250;
    }
    const gaps = sentAt.slice(1).map((t, i) => t - sentAt[i]!);
    // Each retry gives the still picture its usual looks a tick apart, then waits 2 s: about
    // one look a second while the worker is busy, not one every tick.
    expect(Math.max(...gaps.slice(-3))).toBeGreaterThanOrEqual(2_000);
    const lastTen = sentAt.filter((t) => t > clock - 10_000).length;
    expect(lastTen).toBeGreaterThan(0);
    expect(lastTen).toBeLessThanOrEqual(15);
  });

  it("looks again when the pointer leaves during the retries and comes back", () => {
    ready();
    session.fromContent({ kind: "presented", mediaTime: 3 });
    // The first picture takes 9 s; the still picture's other looks are answered busy meanwhile.
    let slow: WorkerRequest | null = null;
    let busy = 0;
    for (let i = 0; busy < 2; i += 1) {
      wiggle(i);
      const sent = handOver();
      if (sent && slow === null) slow = sent;
      else if (sent) {
        session.fromWorker(reply(sent, { analysis: null as never, error: "busy" }));
        busy += 1;
      }
      clock += 250;
    }
    // The slow answer comes late and is dropped; the pointer leaves, then comes back.
    session.fromWorker(reply(slow!));
    expect(session.framesAnalyzed).toBe(0);
    session.fromContent({ kind: "leave" });
    clock += 3_000;
    session.tick();
    let shown = false;
    for (let i = 0; i < 12 && !shown; i += 1) {
      wiggle(i);
      const sent = handOver();
      if (sent) session.fromWorker(reply(sent));
      shown = lastShown()?.cardId === "89631139";
      clock += 250;
    }
    expect(shown).toBe(true);
  });

  it("stops looking once the pointer has rested past the grace period, and starts again when it moves", () => {
    ready();
    session.fromContent({ kind: "presented", mediaTime: 3 });
    wiggle(0);
    const first = handOver()!;
    clock += WATCHDOG_MS + 1;
    session.tick();
    expect(session.lastFrameError).toBe("no reply");
    // The pointer rests: no move for a long time.
    for (let i = 0; i < 200; i += 1) {
      clock += 250;
      session.tick();
      const sent = handOver();
      if (sent) session.fromWorker(reply(sent, { analysis: null as never, error: "busy" }));
    }
    const before = captures().length;
    for (let i = 0; i < 40; i += 1) {
      clock += 250;
      session.tick();
    }
    expect(captures().length).toBe(before);
    session.fromWorker(reply(first));
    wiggle(1);
    clock += 250;
    session.tick();
    const sent = handOver();
    expect(sent).not.toBeNull();
    session.fromWorker(reply(sent!));
    expect(lastShown()).toMatchObject({ cardId: "89631139" });
  });
});
