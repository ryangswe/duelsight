import { type AABB } from "./boxes.js";
import type { AnalysisWidth } from "./capture.js";
import { type GeometricScope, type MeasuredPacingOption, type SessionMode } from "./cadence.js";
import { FrameScheduler } from "./frame-scheduler.js";
import { type GeometricStatus, type ReleaseProgress, type ReleaseStatus, type TiltedStatus, type WorkerReply, type WorkerRequest } from "./messages.js";
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
    /** The card's outline when it is turned (session option `rotatedOutlines`): its tilt in
     *  degrees in (-45, 45], positive clockwise like CSS `rotate()`, and its own sides in fractions
     *  of the picture, about the center of `box`. All three or none; absent for an upright card. */
    rotation?: number;
    localWidth?: number;
    localHeight?: number;
    /** Under a reading hold only: true when the kept card's outline should not be drawn. `box`,
     *  with the outline fields, is where the card was last seen. It is set when `ShownHold.misses`
     *  analyses in a row show the card gone from there (another card named there, or nothing named
     *  or detected there), or one does on a still picture; and when no recent analysis is left and
     *  none is coming (a resting pointer past its grace period on a playing video). It stays set
     *  until an analysis sees the card there again. Absent while the card is seen or its box is
     *  still detected there. */
    held?: true;
}
/** The shown card's hold: how long it survives analyses that do not see it at the pointer. */
export interface ShownHold {
    /** Analyses in a row with nothing there before it goes. A reply with no analysis, or one too
     *  old for the picture on screen when it comes back, is not one. Under a reading hold, analyses
     *  in a row that show the card gone before its outline is hidden (`Shown.held`), so that one
     *  look missing a card that is still there does not blink it; on a still picture, one. */
    misses: number;
    /** Time with no analysis seeing it before it goes, in ms. */
    maxMs: number;
    /** A box detected at the pointer is the held card's box when they overlap at least this much
     *  (intersection over union); a box overlapping less is another card, and ends the hold. */
    sameBoxIou: number;
    /** True: a reading hold. Once a card is shown it stays while the pointer stays on the area it
     *  was seen in at the pointer (the union of its boxes since it was first shown), with no time
     *  limit: `misses` and `maxMs` do not end it, and a cut does not. Another card at the pointer
     *  replaces it only when the viewer moved onto it: a card in about the same box (the same card,
     *  or one not named then) overlapped the kept one in one of the last few analyses that saw the
     *  kept card at the pointer, and the pointer has since moved into that box from outside it. A card that arrived
     *  since, one that slid under a pointer at rest, or one uncovered under a pointer that only
     *  trembles inside its box, does not. The pointer leaving that
     *  area or the picture, a seek, a new source, a stop or a lost worker end it. It is marked
     *  `held` once `misses` analyses in a row show it gone (one on a still picture), or once no
     *  recent analysis is left and none is coming (`Shown.held`). In pointer mode, while it shows a card, a resting pointer is not analyzed
     *  after its grace period. */
    untilPointerLeaves?: boolean;
}
/** The hold that keeps a tooltip from flickering on a live stream. Counted in analyses because a
 *  resting pointer is analyzed at the slow cadence (1-2 s apart): a short time limit would hide the
 *  card on every single miss. */
export declare const SHOWN_HOLD: Readonly<ShownHold>;
/** The reading hold: a shown card stays until the pointer leaves the spot where it was, so that a
 *  viewer can read it after the card has moved ("ShownHold.untilPointerLeaves"). */
export declare const READING_HOLD: Readonly<ShownHold>;
export interface SessionCoreDeps {
    /** The clock, in ms (`performance.now()` in a page). */
    now(): number;
    /** Send a request to the analysis worker, transferring `transfer`. */
    toWorker(request: WorkerRequest, transfer?: Transferable[]): void;
    /** Capture the picture on screen now, at a width within `analysisWidth`, and answer with
     *  `frame(requestId, …)` or `captureFailed(requestId, …)`. */
    capture(requestId: number, analysisWidth: AnalysisWidth): void;
    /** What is shown at the pointer changed: the card, whether its outline is drawn (`held`), or its
     *  box by more than a look's own wobble (`STEADY_BOX`). */
    onShown?(card: Shown | null): void;
    /** Any field of the status changed. */
    onStatus?(status: SessionStatus): void;
    /** A frame was analyzed. */
    onAnalysis?(analysis: FrameAnalysis): void;
    /** The geometric stage's state changed. */
    onGeometricStatus?(status: GeometricStatus): void;
    /** The tilted retry was turned off for the session. */
    onTiltedStatus?(status: TiltedStatus): void;
    /** Replaceable for tests; `hoverAt` by default. */
    hoverAt?: typeof hoverAt;
    /** The time of the picture on screen now, in seconds, for a host that can read it at any
     *  moment (`createSession`: its own video). The max-age rule, the staleness rule and a look's
     *  date then use it; without it, the time last reported by `pointer` or `presented` (a paused
     *  video reports none, so a host that can read the time should give it). */
    mediaTimeNow?(): number;
    /** The video's playback rate now, for a host that can read it (`createSession`: its own video).
     *  It sets how long an answer may stay on screen in wall time (the max age over the rate), which
     *  the stale-picture look and the shown hold's reading wait are timed by. Without it the rate is
     *  measured from the video times reported with `pointer` and `presented` (1 until measured). */
    playbackRate?(): number;
}
export interface SessionCoreOptions {
    /** "pointer" (the default): analyze only around pointer activity. "always-on": analyze for as
     *  long as the session runs. */
    mode?: SessionMode;
    /** Hold a shown card through short gaps. Off when absent; `SHOWN_HOLD` is the usual value. */
    hold?: ShownHold;
    /** Other cards' boxes reported with a shown card (default `MAX_OTHER_BOXES`). */
    maxOtherBoxes?: number;
    /** The geometric stage was asked for: its status starts as "loading" (null otherwise). */
    geometric?: boolean;
    /** True: named cards follow their outline on every frame (`SessionOptions.rotatedOutlines`).
     *  Default false. */
    rotatedOutlines?: boolean;
    /** "focus": each frame asks the geometric stage to verify only the faces at the pointer
     *  (`SessionOptions.geometricScope`). Throws unless the mode is "pointer". Default "all". */
    geometricScope?: GeometricScope;
    /** Pace analysis from the measured analysis time (`SessionOptions.measuredPacing`). Off when
     *  absent. */
    measuredPacing?: MeasuredPacingOption;
    /** Pointer mode: a look on pointer entry. While the pointer is off the picture (from
     *  `pointerLeft` until the next `pointer`) no picture is asked for, so a pointer that comes back
     *  to a playing video finds the newest analyzed frame stale and the staleness rule asks for a
     *  look on that `pointer` call. A load that ends with the pointer active over the picture asks
     *  at once instead of at the next `tick` or the cadence, and one that ends under a mouse resting
     *  past its grace period, within `MAX_REST_MS` of its last move, asks one look (a slow start,
     *  `lookOnLoad`). Off by default here; the compute frame turns it on (`startComputeFrame`). No
     *  effect in "always-on" mode. */
    entryLook?: boolean;
}
/** What `status().loading` becomes on a release-progress reply: the reply's phase while the
 *  release loads; `undefined` (no change) once it has loaded or failed, or the session has
 *  stopped, so a reply that arrives late changes nothing. */
export declare function progressUpdate(state: SessionStatus["state"], reply: ReleaseProgress): SessionStatus["loading"] | undefined;
/** The boxes of an analysis's named and unnamed hover cards other than `box`, in fractions. */
export declare function neighborBoxes(analysis: FrameAnalysis, box: FractionBox, limit?: number): FractionBox[];
/** How far (as a fraction of the picture's width or height) the pointer must be from where the
 *  last look started to count as on a different card when no analyzed answer shows the cards yet.
 *  Half a card's width: a card is about 8 % of a broadcast frame's width (a board of a dozen cards
 *  spans it). */
export declare const NEW_CARD_DISTANCE = 0.04;
export declare class SessionCore {
    private readonly deps;
    readonly scheduler: FrameScheduler;
    private readonly mode;
    private readonly hold;
    private readonly maxOtherBoxes;
    private readonly rotatedOutlines;
    private readonly focusScope;
    private readonly hitTest;
    private readonly pacer;
    /** `SessionCoreOptions.entryLook`; always false outside pointer mode. */
    private readonly entryLook;
    private readonly st;
    private cardList;
    private analysisWidth;
    private maxAgeMs;
    private nextRequestId;
    private inFlight;
    private lastAcceptedRequestId;
    /** Whether the worker answered a look with an analysis since its release loaded: until then
     *  the watchdog waits `FIRST_ANALYSIS_WATCHDOG_MS`. */
    private analyzedSinceLoad;
    private generation;
    private sourceCount;
    private result;
    private pointerAt;
    /** Where the pointer is, for the entry look: a mouse over the picture, or a touch after a tap on
     *  it (touch has no resting pointer: a tap counts until the host reports a `pointerLeft`, which it
     *  does for a touch moving outside, a tap elsewhere or a canceled touch); null before any pointer and
     *  after it left. The scheduler's own notion of inside is set by mouse moves, not by taps. */
    private pointerOver;
    private mediaTime;
    private lastShown;
    private lastStatusKey;
    /** The card the hold keeps. Under a reading hold, `area` is the rectangle enclosing every box it
     *  was seen in at the pointer since it was first shown, which the pointer must stay on, and the
     *  `reading` fields hold the rest (see `readingHold`). */
    private held;
    /** The round trips (capture asked for to reply, ms) of the latest analyzed replies that were not
     *  reused, oldest first: R is their median (`staleBudgetMs`). */
    private roundTrips;
    /** The playback rate, measured from the video times the host reports (`noteMediaTime`); 1 until
     *  measured. */
    private playbackRate;
    /** Where the rate is measured from: a report of the video's time, in this generation, and the
     *  latest report since it (the play from the anchor has been continuous up to it). */
    private rateAnchor;
    /** A slow start's one picture is out (`lookOnLoad`): the prompt retry of its failed capture is
     *  part of it. Cleared once a picture arrives for it, or anything else happens. */
    private slowStart;
    /** A load ended under an eligible pointer while a retry waited out its back-off: the load's look
     *  is asked once the retry is due (`loadEndDue`), not at the paced cadence. */
    private loadEndPending;
    constructor(deps: SessionCoreDeps, options?: SessionCoreOptions);
    private get videoKey();
    /** The pointer moved over the picture (or touched it) at (x, y) in fractions of the picture,
     *  with the video at `mediaTime` seconds, playing at `rate` when the host knows it. Report real
     *  movement only. */
    pointer(x: number, y: number, mediaTime: number, touch?: boolean, rate?: number): void;
    /** The newest analyzed answer for this source (it stays through a look that comes back
     *  unanswered, unlike `result`), and where the pointer was and the card under it when the last
     *  look started: what a move is compared with (`ontoNewCard`). While a retry waits, no analyzed
     *  answer arrives (one would end the wait), so both boxes come from this one analysis. */
    private answered;
    private lookStart;
    private answeredFresh;
    private cardUnderPointer;
    /** Did a pointer move or tap put the pointer on a different card from the one it was on when the
     *  last look started? The card is the face box under it in the newest analyzed answer: a box that
     *  differs (or any box where there was none) is another card; an empty spot is not. Without a
     *  fresh answer for this source, the pointer is further than `NEW_CARD_DISTANCE` from where it was. */
    private ontoNewCard;
    /** A move or tap onto a different card that the gap, the re-look spacing or a look in flight held
     *  back is asked for again here, at the tick, while the retry still waits: a pointer that landed
     *  and rests gets its look as soon as those limits allow, not when the retry is due. It stays due
     *  until a look starts, because `ontoNewCard` compares with where the last look started. */
    private heldMoveDue;
    /** The pointer left the picture. */
    pointerLeft(): void;
    /** The video presented a frame (playback, a seek ended, a re-arm on canplay/playing), playing at
     *  `rate` when the host knows it. */
    presented(mediaTime: number, rate?: number): void;
    /** A seek, or a new source: nothing analyzed before it is shown again. */
    discontinuity(newSource: boolean): void;
    /** The picture under the shown card changed without a seek: look again at once. */
    cut(): void;
    /** The picture captured for `requestId`, taken at `mediaTime`. Closed when it is not the
     *  picture of the look in flight (late, given up on, or never asked for), or when a seek, a new
     *  source or a cut came since the capture was asked for (that look is then finished). */
    frame(requestId: number, bitmap: ImageBitmap, mediaTime: number): void;
    /** Is this capture a repeat of the picture the newest analyzed look was taken at? */
    private isStillRepeat;
    /** A still repeat with no unverified face in the newest result has nothing to add. */
    private stillNeedsNothing;
    /** The capture for `requestId` failed. `retry`: the picture could not be had (not ready yet, or
     *  blank) and is looked at again after a back-off; otherwise a refusal, retried by nothing. */
    captureFailed(requestId: number, reason: string, retry?: boolean): void;
    fromWorker(reply: WorkerReply): void;
    /**
     * With the entry look, once a load has installed its release, cadence and pending picture: a
     * look at once when the pointer is eligible. The viewer is waiting on it, so the cadence (paced
     * or not) does not hold it back; a retry waiting out its back-off does (`loadEndDue`). No
     * pointer activity is made up for it, and the page's gate still decides on the capture.
     *
     * A slow start: a mouse that still rests over the picture past its grace period, within
     * `MAX_REST_MS` of its last activity, gets one look (one picture: a failed capture's prompt
     * retry is part of it, `tick`). If it finds a card, the card keeps analysis going under the usual
     * rules (the "reading" state); if not, nothing more is asked until the pointer moves. A tap gets
     * none: its window is the grace period alone.
     */
    private lookOnLoad;
    /** A mouse over the picture, past its grace period, within `MAX_REST_MS` of its last activity. */
    private slowStartEligible;
    /** A slow start's failed capture is retried when its back-off runs out (prompt), as long as the
     *  pointer still rests within `MAX_REST_MS`. */
    private slowStartRetryDue;
    /** Whether the pointer is over the picture and active: a mouse with activity within the grace
     *  period, or a tap whose window (the same grace period, opened by the tap) is still open. A
     *  pointer that rests past it, or one that left, is not: being over the picture is not enough. */
    private entryEligible;
    /**
     * Arm the scheduler with the cadence for the backend: today's fixed rates, or the measured ones
     * with `measuredPacing`, and the limits the measured round trip and playback rate set:
     *
     *   - the stale-picture threshold (pointer mode): the budget `staleBudgetMs` in video time (B
     *     times the playback rate);
     *   - the focus re-look of a playing picture: the fast cadence F, start to start, not paced (a
     *     viewer waits on it);
     *   - with a hold that ends (`SHOWN_HOLD`, not a reading hold), the reading wait comes before the
     *     card's hold runs out: at most L + `maxMs` - R - M once a round trip is known, not below the
     *     slow cadence and not above the paced wait (L the lifetime, R the round trip, M one driver
     *     tick).
     */
    private applyCadence;
    /** L: how long an answer may stay on screen, in ms of wall time: the release's max age over the
     *  playback rate. */
    private lifetimeMs;
    /**
     * B, the budget of the stale-picture look, in wall ms: max(F, min(P, L - R - M)), with F the
     * fast cadence, P the paced wait of an active pointer (F with pacing off, and until enough
     * analyses are measured), L the lifetime, R the median round trip and M one driver tick. The
     * look starts as late as keeps its answer on screen for the whole of its lifetime, and no later
     * than the paced wait. F until a round trip is known. It is in wall time: the scheduler compares
     * video age with B times the playback rate.
     */
    private staleBudgetMs;
    /**
     * A report of the video's time (a pointer message or a presented frame) at `now`, with the rate
     * the report carries, if any. The rate is, in order: the one the host reads
     * (`SessionCoreDeps.playbackRate`); the one the report carries (the content script reads its
     * video's, `ComputeIn` `rate`); else measured from reports of continuous play: two reports at
     * least `RATE_WINDOW_MS` apart in one generation (no seek, source or cut between), each report
     * between them advancing the video and coming within `RATE_GAP_MS` of the one before. A report
     * that shows no advance (paused, stalled), comes later than that (a page in the background), or a
     * new generation starts the measure over, and keeps the rate as it was. A measure is rounded to
     * `RATE_STEP` and one under `MIN_RATE` is dropped. A changed rate re-arms the scheduler.
     */
    private noteMediaTime;
    private setPlaybackRate;
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
     * status only when a stage was asked for). `{ idle: true }`: the worker was ended on purpose
     * (worker-session.ts `suspend`): as a restart, but not a loss; a running stage is reported off
     * with the reason `idle-unload`. `{ error }`: recognition is off ("failed").
     * Ignored once stopped or failed.
     */
    workerStopped(next: {
        restart: true;
    } | {
        idle: true;
    } | {
        error: string;
    }): void;
    /** Whether a look is out: asked for, or being analyzed. */
    analysisInFlight(): boolean;
    /** Another worker now loads a release in place of one that never loaded (a fallback): the
     *  geometric stage's status starts again ("loading" when this load asks for a stage, null
     *  otherwise), and the previous load's progress is dropped. Nothing else changes. */
    reloading(next: {
        geometric: boolean;
    }): void;
    /**
     * Focus scope: the pointer is on a face the stage applies to that the newest analysis did not
     * verify (or in a group with one), so the picture is analyzed again with the pointer there,
     * as a look started by the pointer: at most once per `HOVER_TRIGGER_MIN_GAP_MS`, never while
     * one is in flight, with the repeats a newly presented picture gets. It stops by itself: that
     * look verifies the pointer's group, so nothing is unverified there any more.
     *
     * With a ready stage and the pointer active over the picture (`entryEligible`: a move or a tap
     * within the grace period), a playing picture is looked at too (`relookDue` with the picture's
     * time), instead of at the next cadence look: on the pointer message, on the reply of the look
     * that was in flight when the pointer got there, or on the next tick; the last look of any kind
     * must have started `HOVER_TRIGGER_MIN_GAP_MS` ago.
     */
    private relookForUnverified;
    /** Whether the geometric stage is ready: only then does a focus look retry the pointer's group
     *  uncapped (without a stage the worker ignores the scope). */
    private stageReady;
    /** The newest look that came back analyzed (`LastLook`). */
    private lastLook;
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
     * at once; the pointer leaving its box, a seek, a new source or a cut end it at once. A reading
     * hold (`untilPointerLeaves`) keeps it on other terms: see `ShownHold.untilPointerLeaves`.
     */
    shown(): Shown | null;
    /** Tell the scheduler what is shown. Returns whether the newest analysis sees a card at the
     *  pointer (with the usual hold or none: whether a card is shown). Under a reading hold the
     *  scheduler hears both: a card it keeps stops the looks of a resting pointer, and a pointer on
     *  a spot the newest analysis finds empty is looked at as an empty spot. */
    private reportShown;
    /**
     * `shown()` under a reading hold (`ShownHold.untilPointerLeaves`). `shown()` is called several
     * times per tick, so what an analysis tells is taken once, the first time it is read
     * (`reading.evidence`): the overlapping cards (`neighbors`, merged from the last few analyses
     * that saw the kept card at the pointer, and capped) and whether the card is gone
     * (`gone`, kept between analyses). With no recent analysis left and none coming, the card is
     * taken as gone too, until an analysis sees it again.
     */
    private readingHold;
    private newReadingHold;
    /** The newest analysis, if recent, analyzed afresh (not a reuse) and not yet taken: taken now. */
    private takeEvidence;
    /** Whether `fresh` is one of the kept card's neighbors (in about the same box, and the same card,
     *  or one that was not named then) and the pointer moved into that box from outside it since the
     *  kept card was last seen at the pointer. */
    private movedOnto;
    /** The kept card's neighbors after another analysis saw it at the pointer: `current`'s, merged
     *  with those of the last `NEIGHBOR_SIGHTINGS` such analyses (a card missed by one look is not
     *  forgotten), newest first, at most `MAX_NEIGHBORS`. */
    private mergeNeighbors;
    /** The cards in the newest result (named or not) whose boxes overlap `area`, but `card` itself. */
    private neighborsIn;
    /** Whether the newest analysis names `card` anywhere in the box it was last seen in: at any of a
     *  grid of points across it, so that a card partly covered (a fan, a stack) still counts. */
    private seenAt;
    /** Whether a recent analysis positively shows `card` gone from where it was last seen: there is
     *  a result for the picture on screen, and it names another card at the center of the card's
     *  box, or names none there and detects no box overlapping the card's box (a card detected but
     *  not named this time is still there). With no recent result nothing is known, and the card is
     *  not called missing. */
    private missing;
    /** Whether the pointer is, in the newest result, on a group that holds an unverified face. */
    private pointerGroupHoldsUnverified;
    private current;
    /** The time of the picture on screen: the host's live time when it gives one, else the time
     *  last reported. */
    private videoTime;
    /** What the newest analysis has at the pointer compared with the held box: the same box, another
     *  one, none, or "unknown" when no analysis is recent enough to judge by. */
    private boxAtPointer;
    private publish;
    /** Report what is shown when it changed: another card or none, its outline drawn or not
     *  (`held`), or its box moved beyond a look's own wobble on a still card (`steady`), so that a
     *  tooltip or outline placed from the box does not jitter. */
    private publishShown;
    private statusKey;
    private publishStatus;
}
