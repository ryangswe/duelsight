import type { AnalysisWidth } from "./capture.js";
import type { AnalysisMode } from "./cadence.js";
import type { GeometricStatus, WorkerReply, WorkerRequest } from "./messages.js";
import type { FrameAnalysis } from "./pipeline.js";
import type { CardTable } from "./remote/card-table.js";
import type { LoadRequest, ReleaseDecision, RemoteReleaseChoice } from "./remote/choose.js";
import { type ReleasePointer } from "./remote/pointer.js";
import { SessionCore, type SessionCoreDeps, type Shown, type ShownHold } from "./session-core.js";
import type { SessionStatus } from "./session.js";
/** The part of a Worker used here. */
export interface WorkerLike {
    postMessage(message: WorkerRequest, transfer?: Transferable[]): void;
    terminate(): void;
    onmessage: ((event: MessageEvent<WorkerReply>) => void) | null;
    onerror: ((event: ErrorEvent) => void) | null;
}
/** How many times a worker that stops after the release has loaded is started again. */
export declare const WORKER_RESTARTS = 1;
/** The load request without the geometric stage: what a restarted worker loads. */
export declare function plainLoad(request: LoadRequest): LoadRequest;
/** The release in effect. */
export interface ReleaseInEffect {
    /** "choosing" while `chooseRelease` decides. */
    source: "remote" | "bundled" | "choosing";
    /** The remote release's id once the worker confirmed it; null otherwise. */
    id: string | null;
    /** Why this source: the choice's reason, "ok", a fallback's reason or "worker-restart". */
    reason: string | null;
    /** The card table of the remote release, once the worker confirmed it; null otherwise. */
    table: CardTable | null;
}
export interface WorkerSessionEnv {
    /** Make an analysis worker (it may throw). */
    createWorker(): WorkerLike;
    /** The bundled release's load request, sent as is. */
    loadRequest: LoadRequest;
    /** The clock, in ms. */
    now(): number;
    mode?: AnalysisMode;
    /** Hold a shown card through short gaps (`SHOWN_HOLD`); off when absent. */
    hold?: ShownHold;
    /** Capture the picture now and answer the core with `frame` or `captureFailed`. */
    capture(requestId: number, analysisWidth: AnalysisWidth): void;
    onShown?(card: Shown | null): void;
    onStatus?(status: SessionStatus): void;
    onAnalysis?(analysis: FrameAnalysis): void;
    /** The geometric stage's state changed; also called with off / `worker-restarted` before a
     *  restarted worker loads, so that a restart can be told from the runtime turning the stage off. */
    onGeometricStatus?(status: GeometricStatus): void;
    /** Which release this page loads; absent: the bundled one, at once. A rejection loads the
     *  bundled one, with the reason `unexpected:<error>`. */
    chooseRelease?(hooks: {
        onDownloading(): void;
    }): Promise<RemoteReleaseChoice>;
    /** Passed to `chooseRelease` as its `onDownloading` hook: a remote release's files are being
     *  fetched. */
    onDownloading?(): void;
    /** A remote release failed in a way that will fail again: do not try it for a while. */
    recordSkip?(pointer: ReleasePointer, reason: string): void;
    /** One decision per release chosen or left, for the log line (`decisionLine`). */
    onDecision?(decision: ReleaseDecision): void;
    /** Replaceable for tests (the core's `hoverAt`). */
    hoverAt?: SessionCoreDeps["hoverAt"];
    /** The time of the picture on screen now, when the host can read it (the core's
     *  `mediaTimeNow`). */
    mediaTimeNow?(): number;
}
export interface WorkerSession {
    /** Null only while `chooseRelease` decides. */
    readonly core: SessionCore | null;
    /** Recognition is off for good: the restart was used up, a worker could not be made, or `stop`. */
    readonly stopped: boolean;
    readonly restarts: number;
    readonly release: ReleaseInEffect;
    /** Call every `DRIVER_TICK_MS`. */
    tick(): void;
    /** End the worker and the core. */
    stop(): void;
}
export declare function createWorkerSession(env: WorkerSessionEnv): WorkerSession;
