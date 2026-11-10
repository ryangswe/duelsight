import type { EmbeddingBank } from "./bank.js";
import type { Frame, FrameDetector } from "./detector/detector.js";
import type { BatchEmbedder } from "./embedder.js";
import type { GeometricEvidence } from "./geometric/fusion.js";
import type { GeometricStage } from "./geometric/stage.js";
import type { LayerCard, StageSize } from "./hover-geometry.js";
import { type HoverSelection } from "./hover-layer.js";
export { hoverAt, hoverCardsOf } from "./hover-at.js";
import { type IdentityDisplay, type IdentityGroups } from "./identity.js";
import { type Orientation, type TiltedEvidence } from "./recognition.js";
import { type AcceptRule } from "./recognizer.js";
import type { TiltedRetrySettings } from "./tilt.js";
/** What the recognizer concluded about one face. */
export interface FaceResult {
    /** The chosen look's best bank row: its card id and name, whether or not it was accepted. */
    topId: string;
    topName: string | null;
    /** The chosen look's score. */
    similarity: number;
    /** The chosen look's margin over the best differently named card. */
    margin: number;
    /** The chosen orientation: 0 upright, k quarter turns counter-clockwise. */
    look: Orientation;
    /** Whether the three turned looks were computed. */
    retried: boolean;
    /** Whether the score reaches tau. */
    tauPassed: boolean;
    /** Whether the accept rule passed: whether a card is named. */
    accepted: boolean;
    /** The card id and name when a card is named, else null. */
    cardId: string | null;
    name: string | null;
    /** Whether the box is among those that reach tau and survive the suppression (the members of
     *  the "accepted-nms" hover selection, and, without a geometric stage, the tracker's input;
     *  with one, the tracker is given the cosine looks that would be kept without it). */
    kept: boolean;
    /** With a geometric stage that ran on this face: what it found and what the embedding alone
     *  answered (Python: `GeometricOutcome.to_json`). The fields above are the fused look's. */
    geometric?: GeometricEvidence;
    /** With the tilted retry, on a face it was tried on: the tilt, the rectangle that named the
     *  card (or none: `scale` null) and the answer before it (Python: `TiltedOutcome.to_json`).
     *  When a rectangle named the card, the fields above are its look's. */
    tilted?: TiltedEvidence;
}
/** One detected card of a frame. */
export interface BoxResult {
    /** `[x, y, width, height]` in pixels of the analyzed frame, clipped to the frame. */
    box: [number, number, number, number];
    /** The detector's score. */
    score: number;
    /** The detector's class index and its name. */
    cls: number;
    className: string;
    /** The recognizer's conclusion, for a face; null for any other class. */
    face: FaceResult | null;
}
/** Everything found in one analyzed frame. Plain data: it can be sent between threads. */
export interface FrameAnalysis {
    /** Size of the analyzed frame, in pixels. */
    frame: StageSize;
    /** The valid detections, best detector score first. */
    boxes: BoxResult[];
    /** The hover layer under the release's selection, bottom of the stack first. */
    hover: {
        selection: HoverSelection;
        cards: LayerCard[];
    };
    /** The track layer. `cards` is empty while `shown` is false. */
    tracks: {
        shown: boolean;
        cards: LayerCard[];
    };
    /** The picture was not continuous with the previous one: the state between frames was reset
     *  before this frame was analyzed. */
    discontinuity: boolean;
    /** How many faces had their turned looks computed, and how many embeddings were computed. */
    retried: number;
    embeddings: number;
    /** Where the time went, in ms. `geometricMs` and `tiltedMs`, parts of `recognizeMs`, are
     *  there only while a geometric stage is set and while the tilted retry runs. */
    timings: {
        detectorMs: number;
        recognizeMs: number;
        analyzeMs: number;
        geometricMs?: number;
        tiltedMs?: number;
    };
}
/** What a caller says about one frame (`Pipeline.analyze`). */
export interface AnalyzeOptions {
    /** False skips the tilted retry on this frame: the caller's own condition, such as the kind
     *  of footage. Default true. */
    tilted?: boolean;
    /** A point in the frame's pixels, such as the pointer: the tilted retry takes the faces whose
     *  box holds it first. */
    focus?: {
        x: number;
        y: number;
    } | null;
    /** True gives each named card on this frame its outline (tilt.ts `outlineRect`): `rotation`,
     *  `localWidth` and `localHeight` follow a tilted card, `bounds` stays the box. Default false:
     *  every card's outline is its box, as before. */
    rotatedOutlines?: boolean;
}
export interface PipelineOptions {
    detector: FrameDetector;
    embedder: BatchEmbedder;
    bank: EmbeddingBank;
    accept?: AcceptRule;
    identityGroups?: IdentityGroups | null;
    identityDisplay?: IdentityDisplay;
    /** Card id to name, from the catalog. Every bank id should be in it. */
    names: ReadonlyMap<string, string>;
    hoverSelection?: HoverSelection;
    /** Names of the detector's classes, by class index. */
    classNames?: readonly string[];
    faceClass?: number;
    minCropPx?: number;
    /** A clock in ms, for the timings. */
    now?: () => number;
    /** The optional geometric stage (geometric/stage.ts). Without it the pipeline is exactly what
     *  it was before the stage existed. `setGeometric` sets or removes it between frames. */
    geometric?: GeometricStage | null;
    /** The release's `tiltedRetry` settings (tilt.ts), or null: the retry is off. `setTiltedRetry`
     *  turns it off between frames. */
    tiltedRetry?: TiltedRetrySettings | null;
}
/** Video time moving back by more than this is a break in continuity (a seek back, a new still). */
export declare const DISCONTINUITY_BACK_SEC = 0.25;
/** Video time jumping forward by more than this is one too (a seek forward). It is generous
 *  against the slowest cadence, a stall, or double-speed playback. */
export declare const DISCONTINUITY_FORWARD_SEC = 5;
/** Whether the picture at `currentSec` breaks continuity with the one at `previousSec`. With
 *  no previous time, or no time at all, it does not. */
export declare function isDiscontinuity(previousSec: number | null, currentSec: number | undefined): boolean;
export declare class Pipeline {
    readonly hoverSelection: HoverSelection;
    private readonly detector;
    private readonly embedder;
    private readonly recognizer;
    private readonly names;
    private readonly classNames;
    private readonly faceClass;
    private readonly minCropPx;
    private readonly now;
    private readonly tracker;
    private readonly gate;
    private readonly hoverIds;
    /** The last track layer shown: it is shown again on a frame that recognized nothing while
     *  the gate still holds, since the tracker returns only the tracks matched on that frame. */
    private heldCards;
    private lastVideoTimeSec;
    private geometric;
    /** The stage that failed during the last frame, and why; taken by `takeGeometricFailure`. */
    private geometricFailure;
    private tiltedRetry;
    /** Why the tilted retry failed during the last frame; taken by `takeTiltedFailure`. */
    private tiltedFailure;
    constructor(options: PipelineOptions);
    /** Rows in the bank. */
    get size(): number;
    /** The stage that failed during a frame since the last call, and its error, or null. The
     *  pipeline has already removed it; the caller disposes of it and reports why. */
    takeGeometricFailure(): {
        stage: GeometricStage;
        error: unknown;
    } | null;
    /** The tilted retry's error during a frame since the last call, or null. The pipeline has
     *  already turned the retry off. */
    takeTiltedFailure(): {
        error: unknown;
    } | null;
    /** The tilted retry's settings in use, or null when it is off. */
    get tiltedSettings(): TiltedRetrySettings | null;
    /** Set or remove the tilted retry's settings. Call it between frames. */
    setTiltedRetry(settings: TiltedRetrySettings | null): void;
    /** The geometric stage in use, or null. */
    get geometricStage(): GeometricStage | null;
    /** Set or remove the geometric stage. Call it between frames: a frame being analyzed keeps
     *  the stage it started with. */
    setGeometric(stage: GeometricStage | null): void;
    /** Forget everything carried between frames: tracks, the gate's run, the hover ids. Models
     *  and the bank stay. */
    reset(): void;
    /**
     * Analyze one frame, already at analysis size. `videoTimeSec` is its time in the video; when
     * it moves backwards, or jumps further forward than any cadence explains, the state between
     * frames is reset first: after a seek the new picture's cards sit where the old ones were,
     * and without a reset the tracker would carry the old identities for a few frames. A detector
     * or model error rejects the call, and that frame shows nothing. `options` says whether the
     * tilted retry runs on this frame and where its focus is.
     */
    analyze(frame: Frame, videoTimeSec?: number, options?: AnalyzeOptions): Promise<FrameAnalysis>;
    private boxResults;
}
