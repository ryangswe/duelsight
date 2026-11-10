import { type Box, type Transform } from "./layout-fit.js";
export { compatible } from "./layout-fit.js";
/** A displayed placement within this many pixels of the truth is correct. */
export declare const CORRECT_PX = 8;
/** Beyond this many pixels a displayed placement is false. */
export declare const FALSE_PX = 20;
/** A drawn box lies on a true card when they overlap at least this much. */
export declare const HITBOX_IOU = 0.3;
/** The largest distance, in pixels of a `width` × `height` frame, between a placement and the
 *  true one over the 5 × 5 grid of `extent` (layout units). */
export declare function fitError(t: Transform, truth: Transform, extent: Box, width: number, height: number): number;
export type AcceptClass = "correct" | "loose" | "false" | "none";
/** How good a displayed placement is; "none" when nothing was displayed. */
export declare function classifyAccept(errorPx: number, displayed: boolean): AcceptClass;
/** A card as it truly is in the picture, frame units. */
export interface TruthCard {
    box: Box;
    identity?: string;
    faceUp: boolean;
}
/** A card box the product drew, frame units. */
export interface Hitbox {
    box: Box;
    identity?: string;
}
export type HitboxClass = "blocked" | "wrong-identity" | "back-hidden" | "correct" | "empty";
/**
 * What a drawn box lies on: "blocked" when its center is outside the visible `mask` or inside a
 * blocker; otherwise by the true card it overlaps most (at `HITBOX_IOU` or more): "back-hidden"
 * for a face-down card or one without identity, "wrong-identity" for another identity,
 * "correct" for the same one; "empty" when no true card overlaps it enough.
 */
export declare function classifyHitbox(h: Hitbox, truthCards: readonly TruthCard[], mask: Box, blockers?: readonly Box[]): HitboxClass;
/**
 * The share of visible, face-up, identified true cards whose center lies inside a drawn box of
 * the same identity; null when there are none. A card is visible when its center is inside the
 * mask and outside every blocker.
 */
export declare function coverage(truthCards: readonly TruthCard[], hitboxes: readonly Hitbox[], mask: Box, blockers?: readonly Box[]): number | null;
/** One entry of a verdict trace: what was displayed from `atMs` on. */
export interface TraceEntry {
    atMs: number;
    display: string;
}
/**
 * How long a fitted display outlives each scene boundary: the time from the boundary to the
 * first trace entry at or after it that is not "fitted" (0 when the display was not fitted at
 * the boundary); null when the display stays fitted to the end of the trace. The trace is in
 * time order.
 */
export declare function exitLatency(trace: readonly TraceEntry[], sceneBoundaries: readonly number[]): Array<number | null>;
