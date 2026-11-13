import type { AnalysisWidth } from "./capture.js";
import { type GeometricScope, type MeasuredPacingOption, type SessionMode } from "./cadence.js";
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
/** When the geometric stage of a load request is loaded: with the release ("start"), or at the
 *  host's first `pointed()` after the release is ready ("pointer"). */
export type GeometricLoad = "start" | "pointer";
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
    mode?: SessionMode;
    /** Measured pacing (`SessionOptions.measuredPacing`); off when absent. */
    measuredPacing?: MeasuredPacingOption;
    /** `SessionOptions.geometricScope`; "all" when absent. */
    geometricScope?: GeometricScope;
    /** When a load request's geometric stage loads: "start" (the default) with the release;
     *  "pointer" at the first `pointed()` (or, for a call while the release loads, once it is ready),
     *  and again after each `resume`.
     *  Until then frames are analyzed without it and its status is not "loading". */
    geometricLoad?: GeometricLoad;
    /** Hold a shown card through short gaps (`SHOWN_HOLD`); off when absent. */
    hold?: ShownHold;
    /** True: named cards follow their outline (`SessionOptions.rotatedOutlines`). */
    rotatedOutlines?: boolean;
    /** The core's `entryLook` (a look on pointer entry). The core is made once and outlives every
     *  worker, so it holds through a fallback, a restart and an idle resume. Off when absent. */
    entryLook?: boolean;
    /** Keep the load request in effect (a remote release's files included) so that `suspend` can
     *  load it again. Off by default: the request is then not held after the worker has it. */
    keepLoadRequest?: boolean;
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
    /** The video's playback rate now, when the host can read it (the core's `playbackRate`). */
    playbackRate?(): number;
}
export interface WorkerSession {
    /** Null only while `chooseRelease` decides. */
    readonly core: SessionCore | null;
    /** Recognition is off for good: the bundled release failed to load, the restart was used up, a
     *  worker could not be made, or `stop`. The core's status says why. */
    readonly stopped: boolean;
    readonly restarts: number;
    readonly release: ReleaseInEffect;
    /** Call every `DRIVER_TICK_MS`. */
    tick(): void;
    /** The viewer pointed at the picture. With `geometricLoad: "pointer"`, the first call asks the
     *  worker for the geometric stage: at once when the release is ready, else as soon as it is
     *  (not after `suspend` or `stop`). Otherwise it does nothing. */
    pointed(): void;
    /** The worker was ended by `suspend` and `resume` has not been called. */
    readonly suspended: boolean;
    /** End the worker to give its memory back, keeping the core and the release in effect; false
     *  (nothing done) unless the session is ready, with no remote release still being tried. The
     *  core goes back to loading. Not a restart. */
    suspend(): boolean;
    /** Start a worker again on the load request in effect when `suspend` was called (without the
     *  geometric stage if the worker had turned it off). If that load fails, or the worker stops
     *  while it loads, it is the one restart (bundled release, plain load); with the restart used up
     *  recognition is off. No effect unless suspended. */
    resume(): void;
    /** End the worker and the core. */
    stop(): void;
}
export declare function createWorkerSession(env: WorkerSessionEnv): WorkerSession;
