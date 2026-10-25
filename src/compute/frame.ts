// SPDX-License-Identifier: Apache-2.0
// The compute frame's wiring, apart from the browser globals so that it can be tested:
//   - it starts only inside a page the extension is built for (`allowedParentOrigin`), and then
//     acts only on messages from that page's window, from that origin;
//   - it hosts the runtime's worker. If the worker fails after the release loaded, it is ended
//     and started again once; a second failure turns recognition off for this page (the
//     content script is told, and nothing is shown).
//   - With `chooseRelease` (src/release/), the page may run a remote release the settings name.
//     A page tries it at most once: when the worker refuses it (rule 10), loads another id
//     (rule 11) or fails to start, a new worker gets the bundled release, without using up the
//     restart; a remote worker that fails after loading restarts once, on the bundled release
//     (rule 12). The card facts of a remote release are built before its load and adopted only
//     when the worker confirms that release; with each shown card they go to the tooltip frame
//     over an extension-only channel (`postFacts`), never through the page.

import type { FrameAnalysis, WorkerReply, WorkerRequest } from "../../vendor/cardvision-browser/cardvision.js";
import { allowedParentOrigin, type CardFactsMessage, type ComputeOut, parseComputeIn, TAG, tag } from "../shared/messages.js";
import type { CardTable } from "../tooltip/card-data.js";
import { refusalRecorded, type ReleasePointer } from "../release/pointer.js";
import { HostSession } from "./host-session.js";
import type { LoadRequest } from "./load-request.js";

/** The part of a Worker used here. */
export interface WorkerLike {
  postMessage(message: WorkerRequest | LoadRequest, transfer?: Transferable[]): void;
  terminate(): void;
  onmessage: ((event: MessageEvent<WorkerReply>) => void) | null;
  onerror: ((event: ErrorEvent) => void) | null;
}

/** The part of the frame's window used here. */
export interface FrameWindow {
  parent: { postMessage(message: unknown, targetOrigin: string): void };
  addEventListener(type: "message", listener: (event: MessageEvent) => void): void;
}

/** What `chooseRelease` decided for this page. */
export type ReleaseChoice =
  | { source: "bundled"; reason: string; pointer: ReleasePointer | null; downloaded: number; ms: number }
  | {
      source: "remote";
      pointer: ReleasePointer;
      /** The load request with the release's files. */
      request: LoadRequest;
      /** The card facts of that release's catalog, built before the load (Addendum 1, A2). */
      facts: CardTable;
      reused: number;
      downloaded: number;
      ms: number;
    };

/** One decision, for the log line (SETTINGS.md, "Logging"). */
export interface ReleaseDecision {
  source: "remote" | "bundled";
  reason: string;
  pointer: string | null;
  reused: number;
  downloaded: number;
  ms: number;
}

export interface ComputeEnv {
  win: FrameWindow;
  /** Whether the frame is inside another page at all. */
  framed: boolean;
  /** The embedding page's origin (`location.ancestorOrigins[0]`), or null. */
  parentOrigin: string | null;
  dev: boolean;
  createWorker(): WorkerLike;
  /** The bundled release's request. */
  loadRequest: LoadRequest;
  now(): number;
  /** A frame was analyzed. */
  onAnalysis?(analysis: FrameAnalysis): void;
  /** Which release this page loads (src/release/choose.ts); absent: the bundled one, at once. */
  chooseRelease?(hooks: { onDownloading(): void }): Promise<ReleaseChoice>;
  /** A remote release failed in a way that will fail again: do not try it for a while. */
  recordSkip?(pointer: ReleasePointer, reason: string): void;
  /** One line per decision. */
  onDecision?(decision: ReleaseDecision): void;
  /** Send a shown card's facts to the tooltip frame (an extension-only channel). */
  postFacts?(message: CardFactsMessage): void;
}

/** How many times a worker that failed after loading is started again. */
export const WORKER_RESTARTS = 1;
/** Cards this frame has shown, kept to answer a tooltip's facts request (oldest dropped first). */
export const SHOWN_IDS_LIMIT = 256;

export interface ReleaseInEffect {
  source: "remote" | "bundled" | "choosing";
  /** The remote release's id once the worker confirmed it; null otherwise. */
  id: string | null;
  reason: string | null;
}

export interface ComputeFrame {
  /** Null only while `chooseRelease` decides. */
  readonly session: HostSession | null;
  readonly stopped: boolean;
  readonly restarts: number;
  readonly release: ReleaseInEffect;
  /** The facts of a card of the remote release in effect, for a tooltip that asks; null otherwise. */
  factsFor(releaseId: string, cardId: string): CardFactsMessage | null;
  tick(): void;
}

/** Start the frame, or return null when it is not inside a page it may serve. */
export function startComputeFrame(env: ComputeEnv): ComputeFrame | null {
  const parentOrigin = env.parentOrigin;
  if (!env.framed || parentOrigin === null || !allowedParentOrigin(parentOrigin, env.dev)) return null;
  const toParent = (message: ComputeOut): void => env.win.parent.postMessage(tag(message), parentOrigin);

  let worker: WorkerLike | null = null;
  let session: HostSession | null = null;
  let restarts = 0;
  let stopped = false;
  /** The remote release the current worker is loading, until it is confirmed or given up on. */
  let trying: Extract<ReleaseChoice, { source: "remote" }> | null = null;
  let sawPreparing = false;
  /** The card facts in effect (a confirmed remote release), and its id. */
  let facts: { releaseId: string; table: CardTable } | null = null;
  const release: ReleaseInEffect = { source: env.chooseRelease ? "choosing" : "bundled", id: null, reason: null };

  /** The pointer of the remote release in effect (for the log after a restart). */
  let remotePointer: string | null = null;
  /** The ids this frame has sent in `shown` with the remote release's facts: a tooltip's request is
   *  answered for these only (Addendum 2: facts of shown cards, nothing a page could ask for). */
  const shownIds = new Set<string>();
  let readyPosted = false;

  /** The facts of a card from the table in effect, whether shown or not. */
  const rowFacts = (releaseId: string, cardId: string): CardFactsMessage | null => {
    if (!facts || facts.releaseId !== releaseId || !Object.hasOwn(facts.table, cardId)) return null;
    const row = facts.table[cardId]!;
    return { releaseId, cardId, facts: { name: row[0], set: row[1], art: row[2], ...(row.length > 3 ? { printed: row[3] ?? null } : {}) } };
  };

  /** A tooltip's request: answered only for a card this frame showed, of its confirmed release. */
  const factsFor = (releaseId: string, cardId: string): CardFactsMessage | null => (shownIds.has(cardId) ? rowFacts(releaseId, cardId) : null);

  /** Shown cards of a remote release: their facts go out first, by the extension-only channel. */
  const toContent = (message: ComputeOut): void => {
    if (message.kind === "shown" && message.card && facts) {
      const f = rowFacts(facts.releaseId, message.card.cardId);
      if (f) {
        shownIds.delete(f.cardId);
        shownIds.add(f.cardId);
        while (shownIds.size > SHOWN_IDS_LIMIT) shownIds.delete(shownIds.values().next().value as string);
        env.postFacts?.(f);
        toParent({ kind: "shown", card: { ...message.card, releaseId: f.releaseId } });
        return;
      }
    }
    toParent(message);
  };

  const decision = (d: Pick<ReleaseDecision, "source" | "reason" | "pointer"> & Partial<ReleaseDecision>): void => {
    env.onDecision?.({ reused: 0, downloaded: 0, ms: 0, ...d });
  };

  const startWorker = (request: LoadRequest): void => {
    const w = env.createWorker();
    const s = new HostSession({
      now: env.now,
      toWorker: (r, transfer) => w.postMessage(r, transfer ?? []),
      toContent,
      ...(env.onAnalysis ? { onAnalysis: env.onAnalysis } : {}),
    });
    w.onmessage = (event) => {
      if (w !== worker) return;
      const reply = event.data;
      if (trying && reply.kind === "release-progress" && reply.phase === "preparing") sawPreparing = true;
      if (trying && reply.kind === "release-status" && !onRemoteStatus(reply)) return;
      s.fromWorker(reply);
    };
    w.onerror = (event) => {
      if (w === worker) onWorkerError(event);
    };
    worker = w;
    session = s;
    w.postMessage(request);
    // Ready once a session can take the content script's messages (its first `presented` too).
    if (!readyPosted) {
      readyPosted = true;
      toParent({ kind: "ready" });
    }
  };

  /** Fall back to the bundled release: a planned replacement, not a restart. */
  const fallBack = (reason: string): void => {
    const t = trying!;
    trying = null;
    facts = null;
    worker?.terminate();
    release.source = "bundled";
    release.id = null;
    release.reason = reason;
    decision({ source: "bundled", reason, pointer: t.pointer.id, reused: t.reused, downloaded: t.downloaded, ms: t.ms });
    startOrFail(env.loadRequest);
  };

  /** The worker's verdict on a remote release. True: pass it on to the session. */
  const onRemoteStatus = (reply: Extract<WorkerReply, { kind: "release-status" }>): boolean => {
    const t = trying!;
    if (reply.ok && reply.release?.id === t.pointer.id) {
      trying = null;
      facts = { releaseId: t.pointer.id, table: t.facts };
      remotePointer = t.pointer.id;
      release.source = "remote";
      release.id = t.pointer.id;
      release.reason = "ok";
      decision({ source: "remote", reason: "ok", pointer: t.pointer.id, reused: t.reused, downloaded: t.downloaded, ms: t.ms });
      return true;
    }
    if (reply.ok) {
      env.recordSkip?.(t.pointer, "id-mismatch");
      fallBack("id-mismatch");
      return false;
    }
    const why = reply.error ?? "no reason given";
    if (refusalRecorded(why, sawPreparing)) env.recordSkip?.(t.pointer, `runtime:${why.slice(0, 120)}`);
    fallBack(`runtime:${why}`);
    return false;
  };

  const onWorkerError = (event: ErrorEvent): void => {
    const reason = event.message || "see the console";
    if (session!.state === "loading") {
      // Through the worker's own path, so a remote release that never started falls back.
      worker!.onmessage?.({ data: { kind: "release-status", ok: false, error: `the worker did not start (${reason})`, release: null, cards: [] } } as unknown as MessageEvent<WorkerReply>);
      return;
    }
    // After loading: end this worker, and nothing it found is shown any more.
    worker!.terminate();
    toContent({ kind: "shown", card: null });
    if (restarts < WORKER_RESTARTS) {
      restarts += 1;
      toContent({ kind: "status", state: "loading", error: null, backend: null });
      // The one restart always loads the bundled release (rule 12): the remote one is not tried
      // again in this page.
      if (release.source === "remote") {
        facts = null;
        release.source = "bundled";
        release.id = null;
        release.reason = "worker-restart";
        decision({ source: "bundled", reason: "worker-restart", pointer: remotePointer });
      }
      startOrFail(env.loadRequest);
      return;
    }
    stopped = true;
    toContent({ kind: "status", state: "failed", error: `the recognition worker stopped (${reason})`, backend: null });
  };

  env.win.addEventListener("message", (event) => {
    if (event.source !== env.win.parent || event.origin !== parentOrigin) return;
    const message = parseComputeIn(event.data);
    if (message && !stopped && session) {
      session.fromContent(message);
      return;
    }
    // A picture that is not used is closed here, never kept.
    const data = event.data as Record<string, unknown> | null;
    const bitmap = data && data[TAG] === 1 ? (data.bitmap as { close?: () => void } | undefined) : undefined;
    if (bitmap && typeof bitmap.close === "function") bitmap.close();
  });

  /** A worker that cannot even be made: recognition is off for this page, as when a load fails. */
  function startOrFail(request: LoadRequest): void {
    try {
      startWorker(request);
    } catch (error) {
      stopped = true;
      toParent({ kind: "status", state: "failed", error: `the recognition worker could not start (${String(error)})`, backend: null });
    }
  }

  if (!env.chooseRelease) {
    startWorker(env.loadRequest);
  } else {
    void env
      .chooseRelease({ onDownloading: () => toParent({ kind: "status", state: "loading", error: null, backend: null }) })
      .catch((error: unknown): ReleaseChoice => ({ source: "bundled", reason: `unexpected:${String(error)}`, pointer: null, downloaded: 0, ms: 0 }))
      .then((choice) => {
        if (choice.source === "remote") {
          trying = choice;
          sawPreparing = false;
          startOrFail(choice.request);
          return;
        }
        release.source = "bundled";
        release.reason = choice.reason;
        decision({ source: "bundled", reason: choice.reason, pointer: choice.pointer?.id ?? null, downloaded: choice.downloaded, ms: choice.ms });
        startOrFail(env.loadRequest);
      });
  }
  return {
    get session() {
      return session;
    },
    get stopped() {
      return stopped;
    },
    get restarts() {
      return restarts;
    },
    get release() {
      return { ...release };
    },
    factsFor,
    tick() {
      if (!stopped) session?.tick();
    },
  };
}
