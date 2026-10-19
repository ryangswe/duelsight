import type { GeometricSettings } from "./config.js";
import type { Cv, CvMat } from "./features.js";
/** The fewest matched points each model can be fitted to. */
export declare const NEEDED: Readonly<Record<string, number>>;
/** Why this OpenCV cannot fit the settings' model, or null when it can. */
export declare function unsupportedFit(cv: Cv, ransac: GeometricSettings["ransac"]): string | null;
/** Whether the model maps the card image onto a convex shape of a plausible area of the crop. */
export declare function plausible(cv: Cv, matrix: CvMat, cropSize: readonly [number, number], cardSize: readonly [number, number], ransac: GeometricSettings["ransac"]): boolean;
/**
 * The inliers of the model fitted to matched points `src` (card) to `dst` (crop), each a
 * float32 array of x, y pairs in match order (Python: `_fit`). 0 when there are too few points,
 * no model is found, or the model is not plausible.
 */
export declare function fitInliers(cv: Cv, src: Float32Array, dst: Float32Array, cropSize: readonly [number, number], cardSize: readonly [number, number], ransac: GeometricSettings["ransac"]): number;
