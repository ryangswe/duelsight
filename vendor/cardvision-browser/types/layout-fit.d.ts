/** Axis-aligned box; x, y top-left. Frame boxes are fractions of the frame; layout boxes are
 *  fractions of the layout's unit square. */
export interface Box {
    x: number;
    y: number;
    w: number;
    h: number;
}
export interface LayoutCard {
    /** Stable id of this card instance within its layout. */
    instance: string;
    /** The identity the recognizer also uses; absent for an unknown or hidden card. */
    identity?: string;
    bounds: Box;
    /** Informational only; the fit does not use it. */
    rotated?: boolean;
}
export interface Layout {
    key: string;
    cards: LayoutCard[];
    /** A region of the layout painted over in the picture (a dialog). Cards whose center lies in
     *  it are never matched. */
    blocking?: Box;
    /** The layout's own width / height in pixels. With the frame's aspect, it turns on the aspect
     *  prior (see the file comment); without it, a placement scales each axis freely. */
    aspect?: number;
}
/** A card the recognizer accepted, in frame units. */
export interface Observation {
    identity: string;
    bounds: Box;
}
/** Per-axis scale and offset from layout units to frame units: v = s·a + t. */
export interface Transform {
    sx: number;
    sy: number;
    tx: number;
    ty: number;
}
/** The same map as a region: the layout's unit square placed in the frame. */
export interface Region {
    x: number;
    y: number;
    width: number;
    height: number;
}
export type InsufficientReason = "too-few" | "share" | "span" | "degenerate" | "zero-inliers" | "aspect";
export type FrameFitOutcome = {
    kind: "verified";
    transform: Transform;
    inliers: string[];
    n: number;
    minIoU: number;
    /** The inliers' layout-center range on each axis, in layout units. */
    span: [number, number];
    /** With the aspect prior: the per-axis refit's sy / sx over the inliers, divided by the
     *  aspect-implied ratio (1 for a picture in proportion). */
    boardRatio?: number;
} | {
    kind: "ambiguous";
    transform: Transform;
    inliers: string[];
    runnerUp: string[];
    n: number;
} | {
    kind: "insufficient";
    reason: InsufficientReason;
    n: number;
    inliers: number;
} | {
    kind: "no-layout";
};
/** The fit's fixed parameters. The toolkit's values are `LAYOUT_FIT_DEFAULTS`; `fitMinIoU` and
 *  `minSpan` come from the product's configuration. */
export interface FitParams {
    /** A correspondence supports a placement when its projected layout box overlaps its frame
     *  box at least this much. */
    fitMinIoU: number;
    /** The inliers' layout centers must spread over at least this share of the layout's extent,
     *  on each axis. */
    minSpan: number;
    /** At most this many correspondences are scored (the largest frame boxes). */
    maxCorrespondences: number;
    /** At least this many inliers. */
    fitMinInliers: number;
    /** At least this share of the correspondences are inliers, as [numerator, denominator]: the
     *  test is `denominator · inliers ≥ numerator · n`, in integers. */
    inlierShare: readonly [number, number];
    /** A second placement with this many supporters outside the first makes the frame ambiguous. */
    ambiguityMin: number;
    /** Two placements are compatible when they put every point of the layout's extent within
     *  this distance of each other, as a fraction of the frame on each axis. */
    compatTol: number;
    /** With the aspect prior: a hypothesis whose sy / sx differs from the aspect-implied ratio by
     *  more than this share of it is set aside. */
    scaleRatioTol: number;
}
/** The toolkit's defaults for the parameters a product does not tune. */
export declare const LAYOUT_FIT_DEFAULTS: {
    /** Bounds the n² scoring. */
    readonly maxCorrespondences: 40;
    /** Two names fit any placement exactly; three is the least that can outvote a wrong one. */
    readonly fitMinInliers: 3;
    readonly inlierShare: readonly [2, 3];
    readonly ambiguityMin: 2;
    /** 0.01 of the frame per axis: 19.2 px across and 10.8 px down a 1920 × 1080 frame. */
    readonly compatTol: 0.01;
    /** 3 % of the aspect-implied ratio. */
    readonly scaleRatioTol: 0.03;
};
/** The 5 × 5 grid over a box (corners included) on which placements are compared. */
export declare const GRID_STEPS = 5;
/** Intersection over union; 0 when the union has no area. */
export declare function iou(a: Box, b: Box): number;
/** A layout box placed in the frame. */
export declare function project(t: Transform, b: Box): Box;
/** A layout point placed in the frame. */
export declare function projectPoint(t: Transform, p: {
    x: number;
    y: number;
}): {
    x: number;
    y: number;
};
/** The layout's unit square in the frame. */
export declare function toRegion(t: Transform): Region;
/** The bounding box of every card of a layout; null for a layout without cards. */
export declare function layoutExtent(layout: Layout): Box | null;
/** The points of the 5 × 5 grid over a box, row by row. */
export declare function gridPoints(box: Box): Array<{
    x: number;
    y: number;
}>;
/** The largest distance, per axis in frame fractions, between two placements over the grid. */
export declare function placementDistance(t1: Transform, t2: Transform, extent: Box): {
    x: number;
    y: number;
};
/** Do two placements agree within `compatTol` of the frame, on each axis, over the extent? */
export declare function compatible(t1: Transform, t2: Transform, extent: Box, compatTol?: number): boolean;
/** Is a point inside a box (edges included)? */
export declare function containsPoint(b: Box, p: {
    x: number;
    y: number;
}): boolean;
export interface Correspondence {
    identity: string;
    /** The observation's box, frame units. */
    v: Box;
    /** The layout card's box, layout units. */
    r: Box;
    /** The layout card's instance. */
    instance: string;
}
/** Is this layout card one the fit may match: it has an identity and is not under the
 *  layout's blocking box? */
export declare function matchable(layout: Layout, card: LayoutCard): boolean;
/**
 * The frame's correspondences with the layout: identities occurring exactly once among the
 * observations and exactly once among the layout's matchable cards. At most `maxCorrespondences`
 * are kept, the largest frame boxes first (ties by identity). The result is in identity order
 * (code units), which is the index order the fit's tie-breaks use.
 */
export declare function correspondences(observations: readonly Observation[], layout: Layout, maxCorrespondences?: number): Correspondence[];
/** The placement that maps one correspondence's layout box exactly onto its frame box; null
 *  when it is not a valid placement. */
export declare function hypothesis(c: Correspondence): Transform | null;
/** Least squares of v = s·a + t; null when the points do not determine a positive scale. */
export declare function fitAxis(points: ReadonlyArray<readonly [number, number]>): {
    s: number;
    t: number;
} | null;
/** The per-axis refit over a set of correspondences: both edges of each box on each axis. */
export declare function refit(cs: readonly Correspondence[]): Transform | null;
/**
 * The refit under the aspect prior: one scale, sy = ratio · sx, and a translation per axis, by
 * least squares over both edges of each box on each axis, in pixels (x residuals weighted by
 * the frame's aspect, so that a pixel counts the same across and down). Null when the points
 * do not determine a positive scale.
 */
export declare function refitAspect(cs: readonly Correspondence[], ratio: number, frameAspect: number): Transform | null;
/** Everything the fit computed, for diagnostics and tests. */
export interface FitDetail {
    outcome: FrameFitOutcome;
    correspondences: Correspondence[];
    /** Supporters of each hypothesis (indices into `correspondences`); empty for an invalid one. */
    support: number[][];
    /** The winning hypothesis's index, or -1. */
    winner: number;
    /** Hypotheses the aspect prior set aside (indices into `correspondences`). */
    aspectRejected: number[];
}
/**
 * Fit one frame. See the file comment for the steps.
 * @param frameAspect The analyzed frame's width / height in pixels; with the layout's `aspect`,
 *   it turns on the aspect prior.
 * @param ratioScale With the aspect prior: the refit uses the aspect-implied ratio times this
 *   (1 by default). A value that is not a positive number makes no placement.
 */
export declare function fitFrame(observations: readonly Observation[], layout: Layout | null, params: FitParams, frameAspect?: number, ratioScale?: number): FrameFitOutcome;
export declare function fitFrameDetail(observations: readonly Observation[], layout: Layout | null, params: FitParams, frameAspect?: number, ratioScale?: number): FitDetail;
