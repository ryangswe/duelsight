// SPDX-License-Identifier: Apache-2.0
// The compute frame's wiring, apart from the browser globals so that it can be tested:
//   - it starts only inside a page the extension is built for (`allowedParentOrigin`), and then
//     acts only on messages from that page's window, from that origin;
//   - it hosts the runtime's worker. If the worker fails after the release loaded, it is ended
//     and started again once; a second failure turns recognition off for this page (the
//     content script is told, and nothing is shown).

import type { FrameAnalysis, WorkerReply, WorkerRequest } from "../../vendor/cardvision-browser/cardvision.js";
import { allowedParentOrigin, type ComputeOut, parseComputeIn, TAG, tag } from "../shared/messages.js";
import { type GeometricStatus, HostSession } from "./host-session.js";
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

export interface ComputeEnv {
  win: FrameWindow;
  /** Whether the frame is inside another page at all. */
  framed: boolean;
  /** The embedding page's origin (`location.ancestorOrigins[0]`), or null. */
  parentOrigin: string | null;
  dev: boolean;
  createWorker(): WorkerLike;
  loadRequest: LoadRequest;
  now(): number;
  /** The geometric stage's state changed. */
  onGeometricStatus?(status: GeometricStatus): void;
  /** A frame was analyzed. */
  onAnalysis?(analysis: FrameAnalysis): void;
}

/** The load request without the geometric stage. */
export function plainLoad(request: LoadRequest): LoadRequest {
  const { geometricUrl: _url, geometricManifestSha256: _sha, ...plain } = request;
  return plain;
}

/** How many times a worker that failed after loading is started again. */
export const WORKER_RESTARTS = 1;

export interface ComputeFrame {
  readonly session: HostSession;
  readonly stopped: boolean;
  readonly restarts: number;
  tick(): void;
}

/** Start the frame, or return null when it is not inside a page it may serve. */
export function startComputeFrame(env: ComputeEnv): ComputeFrame | null {
  const parentOrigin = env.parentOrigin;
  if (!env.framed || parentOrigin === null || !allowedParentOrigin(parentOrigin, env.dev)) return null;
  const toContent = (message: ComputeOut): void => env.win.parent.postMessage(tag(message), parentOrigin);

  let worker: WorkerLike;
  let session: HostSession;
  let restarts = 0;
  let stopped = false;

  const start = (): void => {
    const w = env.createWorker();
    const s = new HostSession({
      now: env.now,
      toWorker: (request, transfer) => w.postMessage(request, transfer ?? []),
      toContent,
      ...(env.onGeometricStatus ? { onGeometricStatus: env.onGeometricStatus } : {}),
      ...(env.onAnalysis ? { onAnalysis: env.onAnalysis } : {}),
    });
    w.onmessage = (event) => {
      if (w === worker) s.fromWorker(event.data);
    };
    w.onerror = (event) => {
      if (w === worker) onWorkerError(event);
    };
    worker = w;
    session = s;
    // A restarted worker gets the plain load: the stage is not tried again in this page.
    w.postMessage(restarts > 0 ? plainLoad(env.loadRequest) : env.loadRequest);
  };

  const onWorkerError = (event: ErrorEvent): void => {
    const reason = event.message || "see the console";
    if (session.state === "loading") {
      session.fromWorker({ kind: "release-status", ok: false, error: `the worker did not start (${reason})`, release: null, cards: [] });
      return;
    }
    // After loading: end this worker, and nothing it found is shown any more.
    worker.terminate();
    toContent({ kind: "shown", card: null });
    if (restarts < WORKER_RESTARTS) {
      restarts += 1;
      env.onGeometricStatus?.({ kind: "geometric-status", state: "off", reason: "worker-restarted", bytes: null });
      toContent({ kind: "status", state: "loading", error: null, backend: null });
      start();
      return;
    }
    stopped = true;
    toContent({ kind: "status", state: "failed", error: `the recognition worker stopped (${reason})`, backend: null });
  };

  env.win.addEventListener("message", (event) => {
    if (event.source !== env.win.parent || event.origin !== parentOrigin) return;
    const message = parseComputeIn(event.data);
    if (message && !stopped) {
      session.fromContent(message);
      return;
    }
    // A picture that is not used is closed here, never kept.
    const data = event.data as Record<string, unknown> | null;
    const bitmap = data && data[TAG] === 1 ? (data.bitmap as { close?: () => void } | undefined) : undefined;
    if (bitmap && typeof bitmap.close === "function") bitmap.close();
  });

  start();
  toContent({ kind: "ready" });
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
    tick() {
      if (!stopped) session.tick();
    },
  };
}
