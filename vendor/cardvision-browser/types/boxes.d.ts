/** An axis-aligned box: top-left corner and size, in pixels of the analyzed frame. */
export interface AABB {
    x: number;
    y: number;
    width: number;
    height: number;
}
/** A box as a center, a size and an angle in degrees. The detector's boxes are axis-aligned, so
 *  the angle is always 0; the shape is kept so that a detector with an angle output can fill it. */
export interface Rect {
    cx: number;
    cy: number;
    w: number;
    h: number;
    angle: number;
}
/** One box proposed by the detector, with the detector's score and class. */
export interface Candidate {
    aabb: AABB;
    rect: Rect;
    score: number;
    cls: number;
}
/** An axis-aligned box as a `Rect` (angle 0). */
export declare function rectOf(b: AABB): Rect;
/** Intersection over union of two boxes; 0 when they do not overlap. */
export declare function iou(a: AABB, b: AABB): number;
/**
 * Greedy suppression: items are visited by descending score (equal scores keep their input
 * order) and an item is kept unless it overlaps an already kept one by `iouThreshold` or more.
 * Returns the kept items, best first.
 */
export declare function nonMaxSuppression<T>(items: readonly T[], aabbOf: (t: T) => AABB, scoreOf: (t: T) => number, iouThreshold: number): T[];
