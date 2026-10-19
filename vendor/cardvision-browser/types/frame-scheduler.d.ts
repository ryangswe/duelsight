import type { AnalysisMode } from "./cadence.js";
import type { FrameEnvelope } from "./messages.js";
/** Spacing of the repeated analyses of a still picture. */
export declare const REPEAT_INTERVAL_MS = 250;
/** How often the host should ask `due`: fine enough for the repeats; the cadence gates the rest. */
export declare const DRIVER_TICK_MS = 250;
/** Pointer mode: analysis keeps running this long after the pointer's last activity. */
export declare const POINTER_GRACE_MS = 10000;
/** Pointer mode: the "reading" state outlasts the tooltip's last showing by this long. */
export declare const READING_LINGER_MS = 5000;
/** The least the stale-frame threshold can be: a moving pointer asks for a fresh analysis when
 *  the newest analyzed frame is more than this much video time away, or more than the cadence
 *  in effect if that is longer. */
export declare const STALE_FRAME_MS = 400;
/** A result older than this, in video time, against a playing video shows no tooltip. It is
 *  above the time an analysis takes on a slow device, so ordinary delay never hides a tooltip.
 *  A release document states its own value (`hover.maxAgeMs`). */
export declare const HOVER_MAX_AGE_MS = 2000;
/** The least time between two analyses asked for by the staleness rule. */
export declare const HOVER_TRIGGER_MIN_GAP_MS = 250;
/** An analysis with no reply after this long is given up on, so that the next frame can go. */
export declare const ANALYSIS_WATCHDOG_MS = 5000;
/** Why an analysis ran: the cadence (a newly presented frame), a repeat of a still picture, the
 *  staleness rule, or a cut under a showing tooltip. */
export type AnalysisTrigger = "cadence" | "repeat" | "hover" | "cut";
/** Why a reply is not shown. */
export type ReplyRejection = 
/** Not the request in flight (it was given up on, or nothing is in flight). */
"stale-request"
/** Older than, or the same as, a reply already shown. */
 | "superseded"
/** From another source than the one on screen. */
 | "video-key"
/** Sent before a seek, a new source or a cut. */
 | "generation";
/** What a reply is judged against. */
export interface LiveTemporalState {
    /** The request in flight; null when there is none. */
    inFlightRequestId: number | null;
    /** The newest request whose reply was shown (0 before the first). */
    lastAcceptedRequestId: number;
    generation: number;
    videoKey: string;
}
/**
 * May this reply be shown? Null means yes; otherwise the reason it may not. A reply is shown
 * only when its request is the one in flight and newer than any reply already shown, and its
 * source and generation both match the live state. A "stale-request" or "superseded" reply is
 * not the answer to the request in flight, which stays in flight; a "video-key" or
 * "generation" reply is (the request is finished, and nothing is shown).
 */
export declare function replyRejection(envelope: FrameEnvelope | undefined, live: LiveTemporalState): ReplyRejection | null;
/** Does a rejected reply still finish the request in flight? */
export declare function rejectionAnswersInFlight(reason: ReplyRejection): boolean;
/** Which analysis policy applies right now. */
export type AnalysisState = "always-on" | "fast" | "reading" | "idle";
export interface StartedInfo {
    /** Time of the analyzed picture in the video, in seconds: what staleness is measured from. */
    videoTimeSec?: number;
    /** Set when the staleness rule (`hoverTriggerDue`) or a cut (`requestLook`) started it. */
    trigger?: "hover" | "cut";
}
export declare class FrameScheduler {
    private intervalMs;
    private readonly confirmFrames;
    private mode;
    private readingIntervalMs;
    private pending;
    private repeatsLeft;
    private lastStartedAt;
    private pointerInside;
    /** The last pointer activity: a move, press or tap over the picture, or the pointer leaving. */
    private lastPointerAt;
    private tooltipShowing;
    /** The last time a showing tooltip was reported while the pointer was inside. */
    private lastTooltipAt;
    private lastHoverTriggerAt;
    private lastVideoTimeSec;
    private discontinuitySinceLast;
    private lastTriggerKind;
    /** A look was asked for at once: `due` ignores the cadence until the next start. */
    private lookRequested;
    /**
     * @param intervalMs The cadence of the mode: the fast cadence in pointer mode, the slow one
     *   in always-on mode (cadence.ts `cadenceMs`).
     * @param confirmFrames How many times a still picture is analyzed in all.
     * @param mode Defaults to "always-on": the cadence alone decides.
     * @param readingIntervalMs The slow cadence of the "reading" state. Defaults to `intervalMs`.
     */
    constructor(intervalMs: number, confirmFrames?: number, mode?: AnalysisMode, readingIntervalMs?: number);
    setIntervalMs(ms: number): void;
    setReadingIntervalMs(ms: number): void;
    /** Is a tooltip showing at the resting pointer? Report it before each evaluation and after
     *  each result. `now` is remembered as the last showing, for `READING_LINGER_MS`. */
    setTooltipShowing(showing: boolean, now: number): void;
    setMode(mode: AnalysisMode): void;
    get analysisMode(): AnalysisMode;
    /** The element presented a new frame (playback, a seek, a new file). */
    framePresented(): void;
    /** A seek or a new source: the newest analyzed frame no longer describes the picture. */
    discontinuity(): void;
    /** The picture under a showing tooltip changed without a seek: look at the current picture as
     *  soon as nothing is in flight, whatever the cadence (still only while analysis may run). */
    requestLook(): void;
    /** Is a look asked for by `requestLook` still waiting to start? */
    get lookPending(): boolean;
    /** The pointer moved over the picture, or was pressed on it. Call it for real movement only:
     *  a pointer resting on the picture is not activity. */
    pointerMoved(now: number): void;
    /** The pointer left the picture. The grace period starts now, and with the pointer outside
     *  there is no "reading" state after it. */
    pointerLeft(now: number): void;
    /** A touch on the picture. Touch has no resting pointer, so a tap only opens the grace period. */
    tapped(now: number): void;
    /** Is the grace period of the last pointer activity still running? */
    pointerActive(now: number): boolean;
    analysisState(now: number): AnalysisState;
    /** May anything be analyzed right now? */
    analysisActive(now: number): boolean;
    /** The cadence in effect: the slow reading cadence while reading, else the mode's cadence. */
    intervalInEffectMs(now: number): number;
    /** Should the current picture be analyzed now, by the cadence or as a repeat of a still? */
    due(now: number): boolean;
    /** The stale-frame threshold in effect, in ms of video time: `STALE_FRAME_MS`, or the cadence
     *  in effect when that is longer. Below the cadence, a pointer moving over a playing video
     *  would ask for analyses faster than the cadence runs them. */
    staleFrameMs(now: number): number;
    /** Is the newest analyzed frame stale against the picture on screen, or is there none yet? */
    frameStale(videoTimeSec: number, now: number): boolean;
    /**
     * The pointer moved over the picture: should the current picture be analyzed at once? Yes
     * when analysis may run, nothing is in flight, the last analysis started this way is at least
     * `HOVER_TRIGGER_MIN_GAP_MS` ago, and the newest analyzed frame is stale. The cadence is not
     * consulted.
     */
    hoverTriggerDue(now: number, videoTimeSec: number, inFlight: boolean): boolean;
    /** An analysis of the current picture was started. */
    started(now: number, info?: StartedInfo): void;
    /** Why the last analysis ran; null before the first. */
    get lastTrigger(): AnalysisTrigger | null;
    /** Time since the last analysis was started, in ms; null before the first. */
    msSinceLastAnalysis(now: number): number | null;
    /** Is there nothing left to do until a new frame is presented? */
    get idle(): boolean;
}
