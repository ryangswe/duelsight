import type { AABB } from "./boxes.js";
import type { AnalysisWidth } from "./capture.js";
import { type AnalysisMode } from "./cadence.js";
import { FrameScheduler } from "./frame-scheduler.js";
import { type GeometricStatus, type ReleaseProgress, type ReleaseStatus, type WorkerReply, type WorkerRequest } from "./messages.js";
import { type FractionBox } from "./compute-messages.js";
import { hoverAt } from "./hover-at.js";
import type { FrameAnalysis } from "./pipeline.js";
import type { SessionStatus } from "./session.js";
export type { FractionBox };
/** The card shown at a position. */
export interface Shown {
    cardId: string;
    name: string;
    /** The card's box, in fractions of the picture. */
    box: FractionBox;
    /** The card's box in pixels of the analyzed frame. */
    frameBox: AABB;
    /** The boxes of the other cards of the same analysis, in fractions, for placing a tooltip off
     *  them (at most `maxOtherBoxes`). */
    others: FractionBox[];
}
/** The shown card's hold: how long it survives analyses that do not see it at the pointer. */
export interface ShownHold {
    /** Analyses in a row with nothing there before it goes. */
    misses: number;
    /** Time with no analysis seeing it before it goes, in ms. */
    maxMs: number;
    /** A box detected at the pointer is the held card's box when they overlap at least this much
     *  (intersection over union); a box overlapping less is another card, and ends the hold. */
    sameBoxIou: number;
}
/** The hold that keeps a tooltip from flickering on a live stream. Counted in analyses because a
 *  resting pointer is analyzed at the slow cadence (1-2 s apart): a short time limit would hide the
 *  card on every single miss. */
export declare const SHOWN_HOLD: Readonly<ShownHold>;
export interface SessionCoreDeps {
    /** The clock, in ms (`performance.now()` in a page). */
    now(): number;
    /** Send a request to the analysis worker, transferring `transfer`. */
    toWorker(request: WorkerRequest, transfer?: Transferable[]): void;
    /** Capture the picture on screen now, at a width within `analysisWidth`, and answer with
     *  `frame(requestId, …)` or `captureFailed(requestId, …)`. */
    capture(requestId: number, analysisWidth: AnalysisWidth): void;
    /** What is shown at the pointer changed (the card, or its box). */
    onShown?(card: Shown | null): void;
    /** Any field of the status changed. */
    onStatus?(status: SessionStatus): void;
    /** A frame was analyzed. */
    onAnalysis?(analysis: FrameAnalysis): void;
    /** The geometric stage's state changed. */
    onGeometricStatus?(status: GeometricStatus): void;
    /** Replaceable for tests; `hoverAt` by default. */
    hoverAt?: typeof hoverAt;
    /** The time of the picture on screen now, in seconds, for a host that can read it at any
     *  moment (`createSession`: its own video). The max-age rule, the staleness rule and a look's
     *  date then use it; without it, the time last reported by `pointer` or `presented` (a paused
     *  video reports none, so a host that can read the time should give it). */
    mediaTimeNow?(): number;
}
export interface SessionCoreOptions {
    /** "pointer" (the default): analyze only around pointer activity. "always-on": analyze for as
     *  long as the session runs. */
    mode?: AnalysisMode;
    /** Hold a shown card through short gaps. Off when absent; `SHOWN_HOLD` is the usual value. */
    hold?: ShownHold;
    /** Other cards' boxes reported with a shown card (default `MAX_OTHER_BOXES`). */
    maxOtherBoxes?: number;
    /** The geometric stage was asked for: its status starts as "loading" (null otherwise). */
    geometric?: boolean;
}
/** What `status().loading` becomes on a release-progress reply: the reply's phase while the
 *  release loads; `undefined` (no change) once it has loaded or failed, or the session has
 *  stopped, so a reply that arrives late changes nothing. */
export declare function progressUpdate(state: SessionStatus["state"], reply: ReleaseProgress): SessionStatus["loading"] | undefined;
/** The boxes of an analysis's named and unnamed hover cards other than `box`, in fractions. */
export declare function neighborBoxes(analysis: FrameAnalysis, box: FractionBox, limit?: number): FractionBox[];
export declare class SessionCore {
    private readonly deps;
    readonly scheduler: FrameScheduler;
    private readonly mode;
    private readonly hold;
    private readonly maxOtherBoxes;
    private readonly hitTest;
    private readonly st;
    private cardList;
    private analysisWidth;
    private maxAgeMs;
    private nextRequestId;
    private inFlight;
    private lastAcceptedRequestId;
    private generation;
    private sourceCount;
    private result;
    private pointerAt;
    private mediaTime;
    private lastShownKey;
    private lastStatusKey;
    private held;
    constructor(deps: SessionCoreDeps, options?: SessionCoreOptions);
    private get videoKey();
    /** The pointer moved over the picture (or touched it) at (x, y) in fractions of the picture,
     *  with the video at `mediaTime` seconds. Report real movement only. */
    pointer(x: number, y: number, mediaTime: number, touch?: boolean): void;
    /** The pointer left the picture. */
    pointerLeft(): void;
    /** The video presented a frame (playback, a seek ended, a re-arm on canplay/playing). */
    presented(mediaTime: number): void;
    /** A seek, or a new source: nothing analyzed before it is shown again. */
    discontinuity(newSource: boolean): void;
    /** The picture under the shown card changed without a seek: look again at once. */
    cut(): void;
    /** The picture captured for `requestId`, taken at `mediaTime`. Closed when it is not the
     *  picture of the look in flight (late, given up on, or never asked for), or when a seek, a new
     *  source or a cut came since the capture was asked for (that look is then finished). */
    frame(requestId: number, bitmap: ImageBitmap, mediaTime: number): void;
    /** The capture for `requestId` failed. `retry`: the picture could not be had (not ready yet, or
     *  blank) and is looked at again after a back-off; otherwise a refusal, retried by nothing. */
    captureFailed(requestId: number, reason: string, retry?: boolean): void;
    fromWorker(reply: WorkerReply): void;
    private onFrameResult;
    /** Call every `DRIVER_TICK_MS`. */
    tick(): void;
    /** Stop: nothing is asked or shown any more, and every later input is ignored (a picture is
     *  still closed). */
    stop(): void;
    /**
     * The worker serving this core stopped. The look in flight and the newest result are dropped,
     * so nothing is shown. `{ restart: true }`: another worker loads the release, the state is
     * "loading" again (the release in effect is kept until it answers), the geometric stage is
     * reported off with the reason `worker-restarted` (to `onGeometricStatus` in any case, in the
     * status only when a stage was asked for). `{ error }`: recognition is off ("failed").
     * Ignored once stopped or failed.
     */
    workerStopped(next: {
        restart: true;
    } | {
        error: string;
    }): void;
    /** Another worker now loads a release in place of one that never loaded (a fallback): the
     *  geometric stage's status starts again ("loading" when this load asks for a stage, null
     *  otherwise), and the previous load's progress is dropped. Nothing else changes. */
    reloading(next: {
        geometric: boolean;
    }): void;
    private requestCapture;
    status(): SessionStatus;
    /** The newest result that still describes the picture on screen, or null. */
    analysis(): FrameAnalysis | null;
    /** The catalog's cards (id, name, art path), once the release has loaded. */
    cards(): ReleaseStatus["cards"];
    /** The card at (fx, fy), in fractions of the picture, in the newest result that may still be
     *  shown; null for nothing. No hold. */
    hitAt(fx: number, fy: number): Shown | null;
    /** The card at the pointer in the newest result that may still be shown; null for nothing, or
     *  with the pointer elsewhere. No hold. */
    fresh(): Shown | null;
    /**
     * The card shown at the pointer now, or null. Without a hold, `fresh()`. With one: once a card
     * is shown it stays while the pointer stays on its box and the analyses that follow do not name
     * another card there, until `hold.misses` analyses in a row have nothing there, or `hold.maxMs`
     * have passed with no analysis seeing it. A different card or box at the pointer replaces it
     * at once; the pointer leaving its box, a seek, a new source or a cut end it at once.
     */
    shown(): Shown | null;
    private current;
    /** The time of the picture on screen: the host's live time when it gives one, else the time
     *  last reported. */
    private videoTime;
    /** What the newest analysis has at the pointer compared with the held box: the same box, another
     *  one, none, or "unknown" when no analysis is recent enough to judge by. */
    private boxAtPointer;
    private publish;
    /** Report what is shown when it changed (the card, or its box). */
    private publishShown;
    private statusKey;
    private publishStatus;
}
