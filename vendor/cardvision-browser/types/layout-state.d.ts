import { type FrameFitOutcome, type Layout, type Observation, type Region, type Transform } from "./layout-fit.js";
/** The product's tuned values. None has a default: a product cannot run on an unexamined one. */
export interface LayoutConfig {
    /** Fit: a correspondence supports a placement at this IoU or more (0.5 to 1). */
    fitMinIoU: number;
    /** Fit: the inliers spread over at least this share of the layout's extent per axis (0 to 1). */
    minSpan: number;
    /** Compatible frame-verified fits in a row that confirm a placement (1 to 3). */
    confirmFits: number;
    /** Two fits in a run are at most this far apart; at least 3 × `intervalMs`. */
    confirmWindowMs: number;
    /** A confirmed placement survives analyses that do not confirm for this long; at least
     *  `freshnessMs`. */
    holdMs: number;
    /** A fitted page is withdrawn when no analysis arrived for this long; at least 2 × `intervalMs`. */
    freshnessMs: number;
    /** The host's probe interval (see `AnalysisMode` "layout"). */
    intervalMs: number;
    /** Optional: a second, incompatible placement with this many supporters of its own makes a
     *  frame ambiguous (2 or 3; 2 when absent). */
    ambiguityMin?: number;
    /** Optional: with the aspect prior (a layout's `aspect` and an analysis's `frameAspect`), a
     *  placement whose sy / sx is off the layout's proportions by more than this share is set
     *  aside (above 0, at most 0.25; 0.03 when absent). */
    scaleRatioTol?: number;
    /** A layout card whose placed box overlaps a recognized card of another identity at this IoU
     *  or more is not drawn (0 to 1). */
    suppressionIoU: number;
}
/** Why a configuration is refused, or null when it is valid. */
export declare function layoutConfigError(config: unknown): string | null;
export interface FrameInput {
    /** The product's generation for this analysis; a different one than the current is dropped. */
    generation: number;
    /** When the analyzed picture was captured, on the host clock that stops while paused. */
    capturedAtMs: number;
    /** Card faces the detector found in the picture, named or not. */
    faces: number;
    /** The recognizer's accepted cards, frame units. */
    observations: Observation[];
    /** The candidate layout in force at `capturedAtMs`; null when there is none. */
    layout: Layout | null;
    /** The analyzed picture's width / height in pixels. With the layout's `aspect`, it turns on
     *  the aspect prior; absent, a placement scales each axis freely. */
    frameAspect?: number;
    /** Identities the product's source offers around this instant (the monitor; empty: not
     *  counted). */
    windowIdentities: ReadonlySet<string>;
}
/** Where a layout comes from. A product implements it over its own feed; the recording reader
 *  (layout-recording.ts) implements it over a recording. */
export interface LayoutSource {
    /** The candidate layout in force for a picture captured at `capturedAtMs`; null for none. */
    layoutAt(capturedAtMs: number): Layout | null;
    /** The identities the source offers around that instant. */
    windowIdentitiesAt(capturedAtMs: number): ReadonlySet<string>;
}
export type State = "off" | "unverified" | "verified" | "held" | "contradicted" | "mismatch" | "no-faces";
export type Display = "fitted" | "today" | "vision" | "hidden";
/** Which row of the precedence table produced a verdict; 0: a timer with nothing to withdraw. */
export type Row = 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12;
export interface Verdict {
    display: Display;
    /** Present exactly when `display` is "fitted". */
    region?: Region;
    /** Layout instances not to draw; empty unless fitted. */
    suppressed: string[];
    state: State;
    /** Evidence went against the layout in this generation, and no placement was confirmed since. */
    contradicted: boolean;
    /** The last analysis's fit ("no-layout" before the first). */
    frame: FrameFitOutcome;
    diagnostics: {
        /** Time since the last analysis arrived (0 before the first). */
        elapsedSinceLastAnalysisMs: number;
        runLength: number;
        monitorShare: number | null;
        row: Row;
        /** The correction to the layout's proportions in force after this event (1 without the
         *  aspect prior, or until two verified fits are pooled). */
        ratioScale: number;
    };
}
/**
 * The layout instances not to draw through a placement: (a) a correspondence the placement does
 * not put on its recognized card (the recognizer saw that card somewhere else), and (b) a card
 * whose placed box overlaps a recognized card of another identity at `suppressionIoU` or more.
 * In layout order.
 */
export declare function suppressedInstances(layout: Layout, observations: readonly Observation[], t: Transform, fitMinIoU: number, suppressionIoU: number, maxCorrespondences?: number): string[];
/** Frame-verified fits whose board ratio the correction pools. */
export declare const RATIO_POOL_SIZE = 15;
export declare class LayoutRegistration {
    readonly config: Readonly<LayoutConfig>;
    private readonly fitParams;
    private readonly monitor;
    private generationValue;
    private stateValue;
    private contradicted;
    private verifiedThisGen;
    private run;
    private confirmed;
    private confirmedBasis;
    private ratioPool;
    /** The correction the kept placements (confirmed, run's latest) were last made with. */
    private appliedScale;
    private holdStart;
    private lastAnalysisAt;
    private zeroStreak;
    private lastFrame;
    private suppressed;
    private current;
    /**
     * @param config The product's tuned values; checked here (a bad one throws).
     * @param options.exclude Identities the monitor leaves out (card types every layout shares).
     */
    constructor(config: LayoutConfig, options?: {
        exclude?: (identity: string) => boolean;
    });
    /** The current generation; null while off. */
    get generation(): number | null;
    get state(): State;
    /** The verdict after the last event. */
    get verdict(): Verdict;
    /** Row 1: the product's mode is no longer eligible. Everything is cleared and every reply
     *  dropped until `reset`. */
    eligibilityLost(nowMs: number): Verdict;
    /** Row 2: a new generation (a navigation, a new source, eligibility regained). */
    reset(generation: number, nowMs: number): Verdict;
    /** A timer event: withdraw a placement whose hold or freshness ran out (row 11). */
    tick(nowMs: number): Verdict;
    /** An analysis arrived. Null when it belongs to another generation (dropped unprocessed). */
    analyze(input: FrameInput, nowMs: number): Verdict | null;
    /** Row 11's condition: a page showing a placement (or hiding the picture) whose hold or
     *  freshness ran out. */
    private expired;
    /**
     * Make the kept placements (confirmed, the run's latest) with this correction, from the
     * correspondences they were made from. It only moves placements: no state, row, timer or run
     * length changes here.
     */
    private applyScale;
    /** The correction to the layout's proportions the next refit uses. */
    private ratioScale;
    private expire;
    private clear;
    private display;
    private build;
}
