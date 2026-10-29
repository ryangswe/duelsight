// SPDX-License-Identifier: Apache-2.0
// Recognition for one video, run from the compute frame.
//
// The runtime's own session (`createSession`) reads a <video> element of its own document. Here
// the video is in the page and the worker is in the extension's frame, so the work is split:
//
//   - the content script reports what happens in the page (the pointer over the picture, frames
//     presented, seeks, a new source) and captures a picture when asked;
//   - this session decides when a picture is analyzed (the runtime's `FrameScheduler`: only
//     around pointer activity, idle 10 s after the last, kept going at the slow cadence while a
//     tooltip shows under a resting pointer), sends it to the runtime's worker, judges each reply
//     (`replyRejection`: nothing from before a seek, a new source, or a request given up on),
//     and answers what a tooltip shows at the pointer (`hoverAt`), never for a result further
//     than the release's `hover.maxAgeMs` of video time from the picture on screen.
//
// It holds no timers: the frame calls `tick` every DRIVER_TICK_MS, and the clock is passed in.

import {
  cadenceMs,
  type ExecutionProvider,
  type FrameAnalysis,
  type FrameEnvelope,
  FrameScheduler,
  HOVER_MAX_AGE_MS,
  hoverAt,
  replyRejection,
  type WorkerReply,
  type WorkerRequest,
} from "../../vendor/cardvision-browser/cardvision.js";
import type { ComputeIn, ComputeOut, ShownCard } from "../shared/messages.js";
import { POINTER_GRACE_MS } from "../constants.js";

/** How often the frame calls `tick`: the runtime's own driver tick. */
export const DRIVER_TICK_MS = 250;
/** A capture or an analysis with no answer after this long is given up on (the runtime's value). */
export const WATCHDOG_MS = 5_000;
/** After a capture fails for want of a picture, or a look comes back with the picture not
 *  analyzed (`retryLook`), try again after these delays, then every 2 s, while the pointer is
 *  over the player and has moved within POINTER_GRACE_MS. */
export const CAPTURE_RETRY_MS = [250, 500, 1_000, 2_000] as const;
/** Hysteresis of a shown card (see `HostSession.shown`). */
export const HOLD_MISSES = 2;
export const HOLD_MAX_MS = 5_000;
/** A box detected at the pointer is the held card's box when they overlap at least this much. */
export const SAME_BOX_IOU = 0.5;
/** Other cards' boxes sent with a shown card, for placing the tooltip off them. */
export const MAX_OTHER_BOXES = 40;
/** The worker's answer to a picture sent while it is still analyzing another. */
const BUSY = "busy";

export interface HostDeps {
  now(): number;
  toWorker(request: WorkerRequest, transfer?: Transferable[]): void;
  toContent(message: ComputeOut): void;
  /** A frame was analyzed (dev builds: timings for the smoke check). */
  onAnalysis?(analysis: FrameAnalysis): void;
  /** Replaceable for tests; the runtime's hit test by default. */
  hoverAt?: typeof hoverAt;
}

interface InFlight {
  requestId: number;
  sentAt: number;
  generation: number;
  videoKey: string;
  /** Set once the picture went to the worker. */
  analyzing: boolean;
}

export class HostSession {
  readonly scheduler = new FrameScheduler(cadenceMs(null, "pointer"), undefined, "pointer", cadenceMs(null, "always-on"));
  state: "loading" | "ready" | "failed" = "loading";
  error: string | null = null;
  backend: ExecutionProvider | null = null;
  lastFrameError: string | null = null;
  framesAnalyzed = 0;
  lastWorkerMs: number | null = null;

  private analysisWidth = { min: 720, max: 1920 };
  private maxAgeMs = HOVER_MAX_AGE_MS;
  private nextRequestId = 1;
  private inFlight: InFlight | null = null;
  private lastAcceptedRequestId = 0;
  private generation = 0;
  private sourceCount = 0;
  private result: { analysis: FrameAnalysis; videoTimeSec: number } | null = null;
  private pointer: { x: number; y: number } | null = null;
  private mediaTime = 0;
  private lastShownKey = "null";
  /** Captures that failed in a row, and when to try again; reset by a picture received, a seek
   *  or a new source, not by the pointer leaving. */
  private captureFailures = 0;
  /** Looks in a row that came back with the picture not analyzed (see `retryLook`); reset by an
   *  analysis, a seek or a new source, not by the pointer leaving. */
  private lookRetries = 0;
  private lastPointerMoveAt = -Infinity;
  private retryAt: number | null = null;
  /** The card shown, held through short gaps (see `shown`). */
  private held: { card: ShownCard; misses: number; seenAt: number } | null = null;
  private readonly hitTest: typeof hoverAt;

  constructor(private readonly deps: HostDeps) {
    this.hitTest = deps.hoverAt ?? hoverAt;
  }

  private get videoKey(): string {
    return `source-${this.sourceCount}`;
  }

  // ------------------------------------------------------------------ from the content script
  fromContent(message: ComputeIn): void {
    const now = this.deps.now();
    switch (message.kind) {
      case "pointer":
        this.pointer = { x: message.x, y: message.y };
        this.lastPointerMoveAt = now;
        // The last picture could not be had and the retries had stopped (a resting pointer):
        // moving again asks once more at the next tick.
        if ((this.captureFailures > 0 || this.lookRetries > 0) && this.retryAt === null && !this.inFlight) this.retryAt = now;
        this.mediaTime = message.mediaTime;
        if (message.touch) this.scheduler.tapped(now);
        else this.scheduler.pointerMoved(now);
        if (this.state === "ready" && this.scheduler.hoverTriggerDue(now, this.mediaTime, this.inFlight !== null)) this.requestCapture("hover");
        break;
      case "leave":
        this.pointer = null;
        // The counts of failed captures and unanalyzed looks are kept: those looks still used up
        // the still picture's looks, so the pointer coming back must start the retries again.
        this.retryAt = null;
        this.scheduler.pointerLeft(now);
        break;
      case "presented":
        this.mediaTime = message.mediaTime;
        this.scheduler.framePresented();
        break;
      case "discontinuity":
        this.generation += 1;
        if (message.newSource) this.sourceCount += 1;
        this.scheduler.discontinuity();
        this.result = null;
        this.held = null;
        this.captureFailures = 0;
        this.lookRetries = 0;
        if (message.newSource) this.scheduler.framePresented();
        break;
      case "frame":
        this.onFrame(message);
        return;
      case "capture-failed":
        if (this.inFlight?.requestId === message.requestId && !this.inFlight.analyzing) {
          this.inFlight = null;
          this.lastFrameError = `capture-failed: ${message.reason}`;
          // The failed look used up the scheduler's "new frame", and a paused video presents no
          // other: when the picture itself could not be had, try again after a short back-off
          // (a refusal for other reasons is not retried).
          if (message.retry) {
            const backoff = CAPTURE_RETRY_MS[Math.min(this.captureFailures, CAPTURE_RETRY_MS.length - 1)]!;
            this.captureFailures += 1;
            this.retryAt = now + backoff;
          }
        }
        break;
    }
    this.publishShown();
  }

  private onFrame(message: Extract<ComputeIn, { kind: "frame" }>): void {
    const sent = this.inFlight;
    if (!sent || sent.requestId !== message.requestId || sent.analyzing) {
      // Not the picture asked for (late, or given up on): it is never analyzed.
      message.bitmap.close();
      return;
    }
    sent.analyzing = true;
    this.captureFailures = 0;
    this.retryAt = null;
    const envelope: FrameEnvelope = { requestId: sent.requestId, mediaTimeSec: message.mediaTime, generation: sent.generation, videoKey: sent.videoKey };
    this.deps.toWorker({ kind: "frame", bitmap: message.bitmap, videoTimeSec: message.mediaTime, envelope }, [message.bitmap]);
  }

  // ------------------------------------------------------------------ from the worker
  fromWorker(reply: WorkerReply): void {
    // The runtime may report a stage this build does not use; there is nothing to do with it.
    if (reply.kind === "geometric-status") return;
    if (reply.kind === "release-status") {
      this.state = reply.ok ? "ready" : "failed";
      this.error = reply.error;
      if (reply.release) {
        this.backend = reply.release.recognizer.ep;
        this.maxAgeMs = reply.release.hoverMaxAgeMs;
        this.analysisWidth = { ...reply.release.analysisWidth };
        this.scheduler.setIntervalMs(cadenceMs(this.backend, "pointer"));
        this.scheduler.setReadingIntervalMs(cadenceMs(this.backend, "always-on"));
        this.scheduler.framePresented();
      }
      this.deps.toContent({ kind: "status", state: this.state, error: this.error, backend: this.backend });
      return;
    }
    if (reply.kind !== "frame-result") return;
    const rejection = replyRejection(reply.envelope, {
      inFlightRequestId: this.inFlight?.requestId ?? null,
      lastAcceptedRequestId: this.lastAcceptedRequestId,
      generation: this.generation,
      videoKey: this.videoKey,
    });
    // A reply to another request than the one in flight leaves that one in flight; a reply from
    // before a seek or another source finishes it, and shows nothing.
    if (rejection === "stale-request" || rejection === "superseded") return;
    this.inFlight = null;
    if (rejection !== null) return;
    this.lastAcceptedRequestId = reply.envelope.requestId;
    this.lastFrameError = reply.error ?? null;
    this.lastWorkerMs = reply.workerMs;
    if (reply.error === BUSY) this.retryLook(this.deps.now());
    if (reply.analysis) {
      this.lookRetries = 0;
      this.framesAnalyzed += 1;
      this.result = { analysis: reply.analysis, videoTimeSec: reply.videoTimeSec };
      this.deps.onAnalysis?.(reply.analysis);
    } else {
      this.result = null;
    }
    this.countMiss();
    this.scheduler.setTooltipShowing(this.shown() !== null, this.deps.now());
    this.publishShown();
  }

  // ------------------------------------------------------------------ the driver
  tick(): void {
    const now = this.deps.now();
    if (this.inFlight && now - this.inFlight.sentAt > WATCHDOG_MS) {
      // No answer: give up on this request so that the next picture can go. A late answer is
      // recognized by its request number and dropped.
      this.inFlight = null;
      this.lastFrameError = "no reply";
      this.retryLook(now);
    }
    if (this.retryAt !== null && now >= this.retryAt) {
      this.retryAt = null;
      // Only while the pointer is over the player and has moved within the runtime's grace
      // period: a resting pointer does not keep it trying for ever.
      if (this.pointer && now - this.lastPointerMoveAt < POINTER_GRACE_MS) {
        if (this.captureFailures === 0 && this.lookRetries > 0) {
          // A look that came back unanalyzed: the same picture is due again at the cadence, with
          // its repeats. Not `requestLook`, which would also mark the picture as changed and let
          // every pointer move look again at once, past the back-off.
          this.scheduler.framePresented();
        } else {
          // A look as soon as nothing is in flight, whatever the cadence (the runtime's way of
          // asking for one now).
          this.scheduler.requestLook();
        }
      }
    }
    this.scheduler.setTooltipShowing(this.shown() !== null, now);
    if (this.state === "ready" && !this.inFlight && this.scheduler.due(now)) this.requestCapture();
    this.publishShown();
  }

  /**
   * A look came back with the picture not analyzed: the worker was still busy with an earlier
   * picture, or gave no answer in time. The look still used up the scheduler's new frame and
   * one of a still picture's repeats, and a paused video presents no other, so without this a
   * slow first analysis on a paused video (a busy computer) leaves nothing analyzed until the
   * video moves. Look again after a back-off, as after a failed capture.
   */
  private retryLook(now: number): void {
    const backoff = CAPTURE_RETRY_MS[Math.min(this.lookRetries, CAPTURE_RETRY_MS.length - 1)]!;
    this.lookRetries += 1;
    this.retryAt = now + backoff;
  }

  private requestCapture(trigger?: "hover"): void {
    if (this.state !== "ready" || this.inFlight) return;
    const now = this.deps.now();
    const requestId = this.nextRequestId++;
    this.inFlight = { requestId, sentAt: now, generation: this.generation, videoKey: this.videoKey, analyzing: false };
    this.scheduler.started(now, { videoTimeSec: this.mediaTime, ...(trigger ? { trigger } : {}) });
    this.deps.toContent({ kind: "capture", requestId, analysisWidth: { ...this.analysisWidth } });
  }

  // ------------------------------------------------------------------ what is shown
  /** The card at the pointer in the newest result that may still be shown, with the boxes of
   *  the other cards of that result; null for nothing. No hysteresis: see `shown`. */
  fresh(): ShownCard | null {
    const result = this.result;
    if (!result || !this.pointer) return null;
    if (Math.abs(this.mediaTime - result.videoTimeSec) * 1000 > this.maxAgeMs) return null;
    const { width, height } = result.analysis.frame;
    if (!(width > 0 && height > 0)) return null;
    const hit = this.hitTest(result.analysis, this.pointer.x * width, this.pointer.y * height);
    if (!hit.box || hit.cardId === null || hit.name === null) return null;
    const box = { x: hit.box.x / width, y: hit.box.y / height, width: hit.box.width / width, height: hit.box.height / height };
    const others = (result.analysis.hover?.cards ?? [])
      .map((c) => c.bounds)
      .filter((b) => b && !(Math.abs(b.x - box.x) < 1e-6 && Math.abs(b.y - box.y) < 1e-6 && Math.abs(b.width - box.width) < 1e-6))
      .slice(0, MAX_OTHER_BOXES)
      .map((b) => ({ x: b.x, y: b.y, width: b.width, height: b.height }));
    return { cardId: hit.cardId, name: hit.name, box, others };
  }

  /**
   * The card a tooltip shows at the pointer now, or null, with hysteresis so that it does not
   * flicker on a live stream: once a card is shown, it stays while the pointer stays on its box
   * and the analyses that follow do not name another card there, until `HOLD_MISSES` analyses
   * in a row have nothing there, or `HOLD_MAX_MS` have passed with no analysis seeing it. A
   * different card at the pointer replaces it at once; the pointer leaving its box, a seek or a
   * new source end it at once. The limit is counted in analyses rather than in time because a
   * resting pointer is analyzed at the slow cadence (1–2 s apart): a time limit shorter than that would hide the card on every single miss.
   */
  shown(): ShownCard | null {
    const now = this.deps.now();
    const fresh = this.fresh();
    if (fresh) {
      this.held = { card: fresh, misses: 0, seenAt: now };
      return fresh;
    }
    const held = this.held;
    if (!held || !this.pointer || !inside(held.card.box, this.pointer)) {
      this.held = null;
      return null;
    }
    const since = now - held.seenAt;
    // The newest analysis found another box at the pointer: a different card is there now, so
    // the held one goes at once. The same box not accepted this time, no box at all (a detector
    // miss on a live stream), or no recent analysis count as misses: the card is held up to
    // HOLD_MISSES analyses in a row, or HOLD_MAX_MS.
    const there = this.boxAtPointer(held.card.box);
    if (there === "other" || held.misses >= HOLD_MISSES || since >= HOLD_MAX_MS) {
      this.held = null;
      return null;
    }
    return held.card;
  }

  /** What the newest analysis has at the pointer compared with the held box: the same box
   *  (IoU at least `SAME_BOX_IOU`), another one, none, or "unknown" when there is no analysis
   *  recent enough to judge by. */
  private boxAtPointer(held: { x: number; y: number; width: number; height: number }): "same" | "other" | "none" | "unknown" {
    const result = this.result;
    if (!result || !this.pointer) return "unknown";
    if (Math.abs(this.mediaTime - result.videoTimeSec) * 1000 > this.maxAgeMs) return "unknown";
    const { width, height } = result.analysis.frame;
    if (!(width > 0 && height > 0)) return "unknown";
    const px = this.pointer.x * width;
    const py = this.pointer.y * height;
    const heldPx = { x: held.x * width, y: held.y * height, width: held.width * width, height: held.height * height };
    let best = 0;
    let any = false;
    for (const b of result.analysis.boxes ?? []) {
      const [x, y, w, h] = b.box;
      if (px < x || px > x + w || py < y || py > y + h) continue;
      any = true;
      best = Math.max(best, iouOf(heldPx, { x, y, width: w, height: h }));
    }
    if (!any) return "none";
    return best >= SAME_BOX_IOU ? "same" : "other";
  }

  /** After each analysis: whether it saw nothing at the pointer while a card is held. */
  private countMiss(): void {
    if (this.held && this.pointer && !this.fresh()) this.held.misses += 1;
  }

  /** Tell the content script when what is shown changed (the card, or its box). */
  private publishShown(): void {
    const card = this.shown();
    const key = card ? `${card.cardId}|${card.box.x}|${card.box.y}|${card.box.width}|${card.box.height}` : "null";
    if (key === this.lastShownKey) return;
    this.lastShownKey = key;
    this.deps.toContent({ kind: "shown", card });
  }
}

function iouOf(a: { x: number; y: number; width: number; height: number }, b: { x: number; y: number; width: number; height: number }): number {
  const w = Math.min(a.x + a.width, b.x + b.width) - Math.max(a.x, b.x);
  const h = Math.min(a.y + a.height, b.y + b.height) - Math.max(a.y, b.y);
  if (w <= 0 || h <= 0) return 0;
  const inter = w * h;
  return inter / (a.width * a.height + b.width * b.height - inter);
}

function inside(box: { x: number; y: number; width: number; height: number }, p: { x: number; y: number }): boolean {
  return p.x >= box.x && p.x <= box.x + box.width && p.y >= box.y && p.y <= box.y + box.height;
}
