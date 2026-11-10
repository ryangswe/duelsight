/** Short side over long side of the card the prior assumes; the same for every game, used only
 *  when the exact solve is not. */
export declare const CARD_ASPECT: number;
export declare const TILT_MAX_SIDE = 128;
export declare const TILT_BINS = 90;
export declare const TILT_BORDER = 0.2;
export declare const TILT_MIN_SIDE = 8;
/** The settings of a release's `tiltedRetry` block (Python: `TiltedRetry`). */
export interface TiltedRetrySettings {
    /** Sizes of the rectangles relative to the solved card, in the order they are tried. */
    scales: number[];
    /** At most this many faces of one frame are retried: faces under the focus point first. */
    maxFacesPerFrame: number;
    /** The retry is turned off for the session when it takes more than this of a frame on two
     *  frames in a row. */
    budgetMs: number;
}
export declare const DEFAULT_TILTED_RETRY: Readonly<TiltedRetrySettings>;
/** An angle in degrees folded to (-45, 45] modulo 90. */
export declare function fold(degrees: number): number;
/** Python's `round` to a whole number: halves go to the even neighbor. */
export declare function roundHalfEven(value: number): number;
/** An RGB or RGBA picture, row by row. */
export interface Pixels {
    data: Uint8ClampedArray | Uint8Array;
    width: number;
    height: number;
    /** Values per pixel: 4 for RGBA (the default), 3 for RGB. */
    channels?: 3 | 4;
}
/**
 * The in-plane tilt, in degrees in (-45, 45], of the card in a crop (Python: `estimate_tilt`).
 * The crop is the shipped crop of a detector box. One under 8 px a side once shrunk, or with no
 * edges, gives 0. Image coordinates, y down.
 */
export declare function estimateTilt(crop: Pixels): number;
/** The outline (`outlineRect`) stays the detector's box below this tilt, in degrees: an upright
 *  card reads a fraction of a degree (exactly +0.5 when perfectly axis-aligned), which is noise. */
export declare const OUTLINE_MIN_TILT = 1;
/** How `rectFromAabb` found the sides. */
export type RectHow = "exact" | "prior";
/**
 * The sides `[w, h]` of a card turned by `tilt` degrees whose bounding box is `width` x `height`
 * (Python: `rect_from_aabb`). `w` runs along the tilted top edge. The exact solve is used while
 * it is well posed and card-shaped; otherwise the card-aspect prior, portrait or landscape,
 * whichever fits better, scaled by least squares.
 */
export declare function rectFromAabb(width: number, height: number, tilt: number): {
    w: number;
    h: number;
    how: RectHow;
};
/**
 * The rectangle of `frame` centered on `(cx, cy)`, `width` x `height`, turned by `tilt` degrees,
 * as RGBA (Python: `sample_rect`). Sides are rounded half to even, at least 2 px. Bilinear,
 * pixel centers at integer + 0.5, black outside the frame, rounded half up.
 */
export declare function sampleRect(frame: Pixels, cx: number, cy: number, width: number, height: number, tilt: number): {
    rgba: Uint8ClampedArray;
    width: number;
    height: number;
};
/**
 * The tilt of the card in `box` and its straightened rectangles at `scales`, in that order
 * (Python: `tilted_rects`). `box` is the detector box in `frame`'s pixels, unrounded; `crop`
 * the shipped crop it gave.
 */
export declare function tiltedRects(frame: Pixels, box: {
    x: number;
    y: number;
    width: number;
    height: number;
}, crop: Pixels, scales: readonly number[]): {
    tilt: number;
    rects: Array<{
        rgba: Uint8ClampedArray;
        width: number;
        height: number;
    }>;
};
/**
 * The outline of a card whose detector box is `boxWidth` x `boxHeight` and whose estimated tilt
 * is `tilt` degrees (Python: `outline_from_tilt`): the rectangle `rectFromAabb` solves, centered
 * on the box and turned by the tilt, or the box itself (`tilt` 0, the box's sides) when the tilt
 * is under `OUTLINE_MIN_TILT` in size or the solve is not exact (the card-aspect prior, near 45
 * degrees, or a box no tilted card fits). `w` runs along the tilted top edge.
 */
export declare function outlineFromTilt(tilt: number, boxWidth: number, boxHeight: number): {
    tilt: number;
    w: number;
    h: number;
};
/**
 * The outline of the card in a detector box `boxWidth` x `boxHeight` pixels, from `crop`, the
 * shipped crop that box gave (Python: `outline_rect`): `outlineFromTilt` of its `estimateTilt`.
 * In pixels, `tilt` in degrees in (-45, 45], positive clockwise on screen (y down). For drawing
 * and hit-testing a card that sits at an angle; it decides nothing.
 */
export declare function outlineRect(crop: Pixels, boxWidth: number, boxHeight: number): {
    tilt: number;
    w: number;
    h: number;
};
/** Every reason `raw` is not a valid `tiltedRetry` block, or null when it is (Python:
 *  `tilted_retry_errors`). */
export declare function tiltedRetryError(raw: unknown): string | null;
